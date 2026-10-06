import { expect, test, type Page } from "@playwright/test";
import { clickHydrated, submitSignIn, waitRegistrationHydrated } from "./helpers";
import { fillRegistration } from "./registration";

// Slugs y nombres del simulado: farmacia-central-valencia y abasto-la-esquina venden en línea;
// farmacia-naguanagua no. Amoxicilina es "recipe" y clonazepam "controlled" (la API no lo restringe).
const ACETAMINOFEN_PATH = "/p/acetaminofen-500-mg-20-tabletas";
const ADD_ACETAMINOFEN = "Agregar al carrito de la tienda elegida: Acetaminofén 500 mg x 20 tabletas de Farmacia Central";
const ADD_HARINA = "Agregar al carrito: Harina de maíz precocida 1 kg de Abasto La Esquina";

async function addAcetaminofen(page: Page): Promise<void> {
  await page.goto(ACETAMINOFEN_PATH);
  await clickHydrated(page.getByRole("button", { name: ADD_ACETAMINOFEN }));
  await expect(page.getByText("Agregado").first()).toBeVisible();
}

function cartLink(page: Page, name: string) {
  return page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name, exact: true });
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflows).toBe(false);
}

// El simulado guarda el carrito de los compradores en la memoria del servidor: van en serie, y el
// de la fusión registra un comprador nuevo en cada corrida para que el e2e sea repetible.
test.describe("carrito", () => {
  test.describe.configure({ mode: "serial" });

  test("el invitado agrega desde la ficha y la tienda, cambia la cantidad y quita una línea", async ({ page }) => {
    await addAcetaminofen(page);
    await expect(cartLink(page, "Carrito, 1 producto")).toBeVisible();

    await page.goto("/tienda/abasto-la-esquina");
    await clickHydrated(page.getByRole("button", { name: ADD_HARINA }));
    await expect(cartLink(page, "Carrito, 2 productos")).toBeVisible();

    await page.goto("/carrito");
    await expect(page.getByRole("heading", { level: 1, name: "Tu carrito" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Productos de Farmacia Central" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Productos de Abasto La Esquina" })).toBeVisible();

    await clickHydrated(page.getByRole("button", { name: "Agregar uno: Acetaminofén 500 mg x 20 tabletas" }));
    await expect(page.getByText("Cantidad: 2")).toBeAttached();

    await page.getByRole("button", { name: "Quitar: Harina de maíz precocida 1 kg" }).click();
    await expect(page.getByRole("list", { name: "Productos de Abasto La Esquina" })).toHaveCount(0);
    await expect(cartLink(page, "Carrito, 1 producto")).toBeVisible();
    await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
  });

  test("agregar al carrito registra add_to_cart con la tienda y el producto", async ({ page }) => {
    // Playwright no expone el cuerpo de un sendBeacon; sin él, el beacon cae a fetch.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "sendBeacon", { value: undefined });
    });
    await page.goto(ACETAMINOFEN_PATH);
    const eventResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/events") &&
        response.request().method() === "POST" &&
        (response.request().postData() ?? "").includes('"add_to_cart"'),
    );
    await clickHydrated(
      page.locator("[data-purchase-bar]").getByRole("button", { name: /^Agregar al carrito de la tienda elegida: Acetaminofén 500 mg x 20 tabletas de / }),
    );

    const response = await eventResponse;
    expect(response.status()).toBe(202);
    expect(JSON.parse(response.request().postData() ?? "{}")).toEqual({
      type: "add_to_cart",
      store_slug: expect.stringMatching(/^[a-z0-9-]+$/),
      product_slug: "acetaminofen-500-mg-20-tabletas",
    });
  });

  test("sin botón en una tienda que no vende ni en un producto de récipe", async ({ page }) => {
    await page.goto("/tienda/farmacia-naguanagua");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Agregar al carrito/ })).toHaveCount(0);

    await page.goto("/p/amoxicilina-500-mg-21-capsulas");
    await expect(page.getByText("Requiere récipe, consúltalo en la tienda.")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Agregar al carrito/ })).toHaveCount(0);
  });

  test("un controlado se agrega: la API sólo restringe récipe", async ({ page }) => {
    await page.goto("/p/clonazepam-0-5-mg-30-tabletas");
    await expect(page.getByText("Venta controlada, consúltalo en la tienda.")).toHaveCount(0);
    await expect(page.locator("[data-purchase-bar]").getByRole("button", { name: /^Agregar al carrito/ })).toBeVisible();
  });

  test("el carrito de invitado se fusiona al registrarse y al entrar", async ({ page }) => {
    const email = `e2e-cart-${Date.now()}@posven.test`;
    const password = "clave-segura-3";

    await addAcetaminofen(page);
    await page.goto("/registro");
    await waitRegistrationHydrated(page);
    await fillRegistration(page, { name: "Carrito E2E", email, phone: "04141112244", password });
    await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
    await expect(page).toHaveURL("/cuenta");
    await expect(cartLink(page, "Carrito, 1 producto")).toBeVisible();

    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(cartLink(page, "Carrito")).toBeVisible();

    await addAcetaminofen(page);
    await page.goto("/entrar");
    await submitSignIn(page, email, password);
    await expect(page).toHaveURL("/cuenta");

    await page.goto("/carrito");
    await expect(page.getByText("Cantidad: 2")).toBeAttached();
    await expect(cartLink(page, "Carrito, 1 producto")).toBeVisible();

    await page.goto(ACETAMINOFEN_PATH);
    await expect(cartLink(page, "Carrito, 1 producto")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("/carrito lleva noindex y queda fuera de robots y del sitemap", async ({ page, request }) => {
    await page.goto("/carrito");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /carrito");

    const sitemap = await (await request.get("/sitemap/static.xml")).text();
    expect(sitemap).not.toContain("/carrito");
  });
});

// Sin JavaScript la ficha, la tienda y /carrito no muestran lo que llega por streaming dentro de un
// <Suspense> (ofertas, productos, líneas del carrito, contador): con PPR lo revela un script. El
// botón es un formulario, pero no se ve. Queda visible aquí hasta que se decida (resultado del plan 4a).
test.describe("carrito sin JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test.fixme("Agregar suma y el contador sube tras la recarga", async ({ page }) => {
    await page.goto(ACETAMINOFEN_PATH);
    await clickHydrated(page.getByRole("button", { name: ADD_ACETAMINOFEN }));
    await expect(cartLink(page, "Carrito, 1 producto")).toBeVisible();
  });
});

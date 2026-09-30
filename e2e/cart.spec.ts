import { expect, test, type Page } from "@playwright/test";

// Slugs y nombres del simulado: farmacia-central-valencia y abasto-la-esquina venden en línea;
// farmacia-naguanagua no. Amoxicilina es "recipe" y clonazepam "controlled".
const ACETAMINOFEN_PATH = "/p/acetaminofen-500-mg-20-tabletas";
const ADD_ACETAMINOFEN = "Agregar al carrito: Acetaminofén 500 mg x 20 tabletas de Farmacia Central";
const ADD_HARINA = "Agregar al carrito: Harina de maíz precocida 1 kg de Abasto La Esquina";

async function addAcetaminofen(page: Page): Promise<void> {
  await page.goto(ACETAMINOFEN_PATH);
  await page.getByRole("button", { name: ADD_ACETAMINOFEN }).click();
  await expect(page.getByText("Agregado").first()).toBeVisible();
}

function cartLink(page: Page, name: string) {
  return page.locator("header").getByRole("link", { name, exact: true });
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
    await page.getByRole("button", { name: ADD_HARINA }).click();
    await expect(cartLink(page, "Carrito, 2 productos")).toBeVisible();

    await page.goto("/carrito");
    await expect(page.getByRole("heading", { level: 1, name: "Tu carrito" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Productos de Farmacia Central" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Productos de Abasto La Esquina" })).toBeVisible();

    await page.getByRole("button", { name: "Agregar uno: Acetaminofén 500 mg x 20 tabletas" }).click();
    await expect(page.getByText("Cantidad: 2")).toBeAttached();

    await page.getByRole("button", { name: "Quitar: Harina de maíz precocida 1 kg" }).click();
    await expect(page.getByRole("list", { name: "Productos de Abasto La Esquina" })).toHaveCount(0);
    await expect(cartLink(page, "Carrito, 1 producto")).toBeVisible();
  });

  test("sin botón en una tienda que no vende ni en productos restringidos", async ({ page }) => {
    await page.goto("/tienda/farmacia-naguanagua");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Agregar al carrito:/ })).toHaveCount(0);

    await page.goto("/p/amoxicilina-500-mg-21-capsulas");
    await expect(page.getByText("Requiere récipe, consúltalo en la tienda.")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Agregar al carrito:/ })).toHaveCount(0);

    await page.goto("/p/clonazepam-0-5-mg-30-tabletas");
    await expect(page.getByText("Venta controlada, consúltalo en la tienda.")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Agregar al carrito:/ })).toHaveCount(0);
  });

  test("el carrito de invitado se fusiona al registrarse y al entrar", async ({ page }) => {
    const email = `e2e-cart-${Date.now()}@posven.test`;
    const password = "clave-segura-3";

    await addAcetaminofen(page);
    await page.goto("/registro");
    await page.getByLabel("Nombre").fill("Carrito E2E");
    await page.getByLabel("Correo").fill(email);
    await page.getByLabel("Teléfono").fill("+584141112244");
    await page.getByLabel("Contraseña").fill(password);
    await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
    await expect(page).toHaveURL("/cuenta");
    await expect(cartLink(page, "Carrito, 1 producto")).toBeVisible();

    await page.getByRole("button", { name: "Mi cuenta" }).click();
    await page.getByRole("menuitem", { name: "Salir" }).click();
    await expect(cartLink(page, "Carrito")).toBeVisible();

    await addAcetaminofen(page);
    await page.goto("/entrar");
    await page.getByLabel("Correo").fill(email);
    await page.getByLabel("Contraseña").fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
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
    await page.getByRole("button", { name: ADD_ACETAMINOFEN }).click();
    await expect(cartLink(page, "Carrito, 1 producto")).toBeVisible();
  });
});

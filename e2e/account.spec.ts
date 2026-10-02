import { expect, test, type Page } from "@playwright/test";

const PRODUCT_SLUG = "acetaminofen-500-mg-20-tabletas";
const PRODUCT_PATH = `/p/${PRODUCT_SLUG}`;
const SEEDED_EMAIL = "comprador@posven.test";
const SEEDED_PASSWORD = "clave-segura-1";
const RATE_LIMITED_EMAIL = "limite@posven.test";

async function signIn(page: Page, email: string, password: string, volver?: string): Promise<void> {
  await page.goto(volver === undefined ? "/entrar" : `/entrar?volver=${encodeURIComponent(volver)}`);
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflows).toBe(false);
}

// El simulado de cuentas guarda su estado en la memoria del servidor: los casos van en serie y
// comparten el comprador que registra el segundo.
test.describe("cuenta del comprador", () => {
  test.describe.configure({ mode: "serial" });

  const email = `e2e-${Date.now()}@posven.test`;
  const name = "Prueba E2E";
  const phone = "+584141112233";
  const password = "clave-segura-2";

  test("sin sesión, /cuenta/perfil lleva a entrar con volver", async ({ page }) => {
    await page.goto("/cuenta/perfil");

    await expect(page).toHaveURL("/entrar?volver=%2Fcuenta%2Fperfil");
    await expect(page.getByRole("heading", { level: 1, name: "Entrar" })).toBeVisible();
  });

  test("registrar un comprador lo lleva a su cuenta y verificar el correo quita el aviso", async ({ page }) => {
    await page.goto("/registro");
    await page.getByLabel("Nombre").fill(name);
    await page.getByLabel("Correo").fill(email);
    await page.getByLabel("Teléfono").fill(phone);
    await page.getByLabel("Contraseña").fill(password);
    await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();

    await expect(page).toHaveURL("/cuenta");
    await expect(page.getByRole("heading", { level: 1, name: `Hola, ${name}` })).toBeVisible();
    await expect(page.getByText("no está verificado")).toBeVisible();

    await page.goto("/verificar/verificacion-simulada");
    await page.getByRole("button", { name: "Verificar mi correo" }).click();
    await expect(page.getByText("Tu correo quedó verificado.")).toBeVisible();

    await page.goto("/cuenta");
    await expect(page.getByRole("heading", { level: 1, name: `Hola, ${name}` })).toBeVisible();
    await expect(page.getByText("no está verificado")).toHaveCount(0);
  });

  test("Salir deja Entrar en la cabecera y entrar de nuevo vuelve a volver", async ({ page }) => {
    await signIn(page, email, password);
    await expect(page).toHaveURL("/cuenta");

    await page.getByRole("button", { name: "Mi cuenta" }).click();
    await page.getByRole("menuitem", { name: "Salir" }).click();
    await expect(page.locator("header").getByRole("link", { name: "Entrar" })).toBeVisible();

    await signIn(page, email, password, "/cuenta/favoritos");
    await expect(page).toHaveURL("/cuenta/favoritos");
  });

  test("el comprador sembrado edita su nombre en el perfil", async ({ page }) => {
    await signIn(page, SEEDED_EMAIL, SEEDED_PASSWORD, "/cuenta/perfil");
    await expect(page).toHaveURL("/cuenta/perfil");

    await page.getByLabel("Nombre", { exact: true }).fill("Comprador editado");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByText("Guardamos tus datos.")).toBeVisible();
  });

  test("una dirección nueva con la ubicación del navegador queda predeterminada", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 10.162, longitude: -68.007 });
    await signIn(page, email, password, "/cuenta/direcciones");
    await expect(page).toHaveURL("/cuenta/direcciones");

    const newAddress = page.getByRole("region", { name: "Agregar dirección" });
    await newAddress.getByLabel("Nombre de la dirección").fill("Trabajo");
    await newAddress.getByLabel("Quién recibe").fill(name);
    await newAddress.getByLabel("Teléfono").fill(phone);
    await newAddress.getByRole("combobox", { name: "Ciudad" }).click();
    await page.getByRole("option", { name: "Valencia" }).click();
    await newAddress.getByLabel("Dirección", { exact: true }).fill("Calle 1");
    await newAddress.getByRole("button", { name: "Usar mi ubicación" }).click();
    await expect(newAddress.getByText("Ubicación lista")).toBeVisible();
    await newAddress.getByLabel("Usar como predeterminada").check();
    await newAddress.getByRole("button", { name: "Guardar dirección" }).click();

    await expect(page.getByText("Guardamos la dirección.")).toBeVisible();
    const saved = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Trabajo" }) });
    await expect(saved).toBeVisible();
    await expect(saved.getByText("Predeterminada", { exact: true })).toBeVisible();
  });

  test("eliminar una dirección avisa con un toast y la quita de la lista", async ({ page }) => {
    await signIn(page, email, password, "/cuenta/direcciones");
    await expect(page).toHaveURL("/cuenta/direcciones");

    await page.getByRole("button", { name: "Eliminar Trabajo" }).click();

    await expect(page.getByText("Eliminamos la dirección.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Trabajo" })).toHaveCount(0);
  });

  test("un favorito pide entrar, vuelve a la ficha y se guarda", async ({ page }) => {
    await page.goto(PRODUCT_PATH);
    await page.getByRole("link", { name: "Guardar en favoritos" }).click();
    await expect(page).toHaveURL(`/entrar?volver=${encodeURIComponent(PRODUCT_PATH)}`);

    await page.getByLabel("Correo").fill(email);
    await page.getByLabel("Contraseña").fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();

    await expect(page).toHaveURL(PRODUCT_PATH);
    const favorite = page.getByRole("button", { name: "Guardar en favoritos" });
    await expect(favorite).toBeVisible();
    await favorite.click();
    await expect(page.getByText("Guardamos el favorito.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Quitar de favoritos" })).toBeVisible();

    await page.goto("/cuenta/favoritos");
    await expect(page.getByRole("link", { name: /Acetaminofén 500 mg x 20 tabletas/ })).toBeVisible();

    await page.getByRole("button", { name: /^Quitar Acetaminofén 500 mg x 20 tabletas de favoritos$/ }).click();
    await expect(page.getByText("Quitamos el favorito.")).toBeVisible();
    await expect(page.getByRole("link", { name: /Acetaminofén 500 mg x 20 tabletas/ })).toHaveCount(0);
  });

  test("las rutas de acceso y de cuenta van con noindex y fuera de robots y sitemap", async ({ page, request }) => {
    for (const path of ["/entrar", "/registro"]) {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    }

    await signIn(page, email, password);
    await expect(page).toHaveURL("/cuenta");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /cuenta");

    const sitemap = await (await request.get("/sitemap/static.xml")).text();
    expect(sitemap).not.toContain("/entrar");
    expect(sitemap).not.toContain("/cuenta");
  });

  test("un correo con demasiados intentos muestra los segundos de espera", async ({ page }) => {
    await signIn(page, RATE_LIMITED_EMAIL, "cualquiera-123");

    await expect(page.getByText("Demasiados intentos, prueba en 42 segundos")).toBeVisible();
  });

  test("la cabecera no desborda en móvil, con y sin sesión", async ({ page }) => {
    for (const path of ["/", PRODUCT_PATH]) {
      await page.goto(path);
      await expect(page.locator("header").getByRole("link", { name: "Entrar" })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }

    await signIn(page, email, password);
    await expect(page).toHaveURL("/cuenta");
    for (const path of ["/", PRODUCT_PATH]) {
      await page.goto(path);
      await expect(page.locator("header").getByText("Mi cuenta", { exact: true })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });
});

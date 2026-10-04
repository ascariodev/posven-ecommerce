import { expect, test, type Page } from "@playwright/test";

const FOOTER_LINKS = [
  { name: "Para comercios", path: "/comercios" },
  { name: "Términos", path: "/terminos" },
  { name: "Privacidad", path: "/privacidad" },
];

for (const { name, path } of FOOTER_LINKS) {
  test(`el pie enlaza a ${path} y responde 200`, async ({ page }) => {
    await page.goto("/");
    const link = page.locator("footer").getByRole("link", { name, exact: true });
    await expect(link).toHaveAttribute("href", path);

    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
  });
}

test("/comercios tiene canónica propia y es indexable", async ({ page }) => {
  await page.goto("/comercios");

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "http://localhost:3000/comercios",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
});

for (const path of ["/terminos", "/privacidad"]) {
  test(`${path} lleva noindex mientras es borrador`, async ({ page }) => {
    await page.goto(path);

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
}

test("el sitemap static incluye /comercios y no las legales mientras son borrador", async ({
  request,
}) => {
  const response = await request.get("/sitemap/static.xml");
  expect(response.status()).toBe(200);
  const sitemap = await response.text();
  expect(sitemap).toContain("http://localhost:3000/comercios");
  expect(sitemap).not.toContain("/terminos");
  expect(sitemap).not.toContain("/privacidad");
});

test.describe("barra inferior en móvil", () => {
  const nav = (page: Page) => page.getByRole("navigation", { name: "Navegación principal" });

  test("pinta los cinco destinos, marca el activo y lleva Favoritos y Cuenta al ingreso", async ({ page }) => {
    await page.goto("/");

    await expect(nav(page).getByRole("link")).toHaveText(["Inicio", "Buscar", "Favoritos", "Carrito", "Cuenta"]);
    await expect(nav(page).getByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
    await expect(nav(page).getByRole("link", { name: "Favoritos" })).toHaveAttribute(
      "href",
      "/entrar?volver=%2Fcuenta%2Ffavoritos",
    );
    await expect(nav(page).getByRole("link", { name: "Cuenta" })).toHaveAttribute("href", "/entrar?volver=%2Fcuenta");
    await expect(page.locator("header").getByRole("link", { name: /^Carrito/ })).toBeHidden();
    await expect(page.locator("header").getByRole("link", { name: "Entrar" })).toBeHidden();

    await nav(page).getByRole("link", { name: "Buscar" }).click();
    await expect(page).toHaveURL(/\/buscar/);
    await expect(nav(page).getByRole("link", { name: "Buscar" })).toHaveAttribute("aria-current", "page");
  });

  test("la cabecera no envuelve el logo y la ubicación en 360 px ni 320 px", async ({ page }) => {
    for (const width of [360, 320]) {
      await page.setViewportSize({ width, height: 740 });
      await page.goto("/comercios");
      const logo = await page.locator("header").getByRole("link", { name: /\S/ }).first().boundingBox();
      const location = await page.locator("header").getByRole("button", { name: /^Buscar cerca de/ }).boundingBox();
      expect(logo).not.toBeNull();
      expect(location).not.toBeNull();
      expect(Math.abs((location?.y ?? 0) - (logo?.y ?? 0))).toBeLessThan(24);
      const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflows).toBe(false);
    }
  });
});

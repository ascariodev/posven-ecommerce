import { expect, test, type Page } from "@playwright/test";

const FOOTER_LINKS = [
  { name: "Para comercios", path: "/vende" },
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

test("/comercios redirige de forma permanente a /vende", async ({ request }) => {
  const response = await request.get("/comercios", { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(new URL(response.headers().location, "http://localhost:3000").pathname).toBe("/vende");
});

test("/tiendas lista las tiendas, tiene canónica propia, es indexable y se llega desde el inicio", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Ver todos" }).click();
  await expect(page).toHaveURL(/\/tiendas$/);

  await expect(page.getByRole("heading", { level: 1, name: "Tiendas" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Comercios" }).getByRole("link").first()).toHaveAttribute(
    "href",
    /^\/tienda\//,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "http://localhost:3000/tiendas");
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
});

for (const path of ["/terminos", "/privacidad"]) {
  test(`${path} lleva noindex mientras es borrador`, async ({ page }) => {
    await page.goto(path);

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
}

test("el sitemap static incluye /tiendas, /ayuda, /vende y no las legales mientras son borrador", async ({
  request,
}) => {
  const response = await request.get("/sitemap/static.xml");
  expect(response.status()).toBe(200);
  const sitemap = await response.text();
  expect(sitemap).toContain("http://localhost:3000/tiendas");
  expect(sitemap).not.toContain("/comercios");
  expect(sitemap).toContain("http://localhost:3000/ayuda");
  expect(sitemap).toContain("http://localhost:3000/vende");
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
      await page.goto("/vende");
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

test("una ruta inexistente responde 404 con el estado vacío del sitio", async ({ page }) => {
  const response = await page.goto("/esta-ruta-no-existe");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "No encontramos esta página" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ir al inicio" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Buscar productos" })).toHaveAttribute("href", "/buscar");
});

test("/ayuda tiene canónica propia, filtra las preguntas y se llega desde el pie", async ({ page }) => {
  await page.goto("/");
  const link = page.locator("footer").getByRole("link", { name: "Centro de ayuda", exact: true });
  await expect(link).toHaveAttribute("href", "/ayuda");
  await link.click();
  await expect(page).toHaveURL(/\/ayuda$/);

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "http://localhost:3000/ayuda");
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

  const questions = page.locator("details");
  await expect(questions.first()).toBeVisible();
  const total = await questions.count();
  expect(total).toBeGreaterThan(1);

  const search = page.getByRole("searchbox", { name: "Buscar en la ayuda" });
  await search.fill("récipe");
  await expect(questions).not.toHaveCount(total);
  await expect(questions.first()).toBeVisible();

  await search.fill("zzzzqqq");
  await expect(page.getByRole("heading", { name: "Sin coincidencias" })).toBeVisible();
});

test("/ayuda lleva el héroe a ancho completo sin desborde horizontal a 375 px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/ayuda");
  const hero = page.getByRole("heading", { level: 1, name: "¿En qué te ayudamos?" }).locator("xpath=ancestor::section[1]");
  const box = await hero.boundingBox();
  expect(box?.x).toBe(0);
  expect(box?.width).toBe(375);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("/vende tiene canónica propia, sus secciones y el contacto sólo con destino", async ({ page }) => {
  const response = await page.goto("/vende");
  expect(response?.status()).toBe(200);

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "http://localhost:3000/vende");
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

  await expect(
    page.getByRole("heading", { level: 1, name: "Tu inventario, visible para los compradores de tu zona" }),
  ).toBeVisible();
  await expect(page.getByText("Así te ven los compradores")).toBeVisible();
  await expect(page.getByText("$ 1,35")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tres pasos y estás en línea" })).toBeVisible();
  for (const title of ["Activa tu tienda en el panel", "Tus precios vienen de tu caja", "Recibe visitas, contactos y pedidos"]) {
    await expect(page.getByRole("heading", { level: 3, name: title })).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Preguntas de comercios" })).toBeVisible();
  await expect(page.locator("details")).not.toHaveCount(0);

  const cta = page.getByRole("link", { name: "Quiero aparecer" });
  const total = await cta.count();
  if (total === 0) {
    await expect(page.getByRole("heading", { name: "¿Listo para que te encuentren?" })).toHaveCount(0);
  } else {
    expect(total).toBe(2);
    for (const href of await cta.evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
      expect(href).toMatch(/^(https:\/\/wa\.me\/\d+\?text=|mailto:)/);
    }
  }
});

test.describe("modo oscuro", () => {
  for (const [colorScheme, dark] of [
    ["dark", true],
    ["light", false],
  ] as const) {
    test(`con el sistema en ${colorScheme}, <html> ${dark ? "lleva" : "no lleva"} la clase dark`, async ({ page }) => {
      const warnings: string[] = [];
      page.on("console", (message) => {
        if (/hydrat/i.test(message.text())) warnings.push(message.text());
      });
      await page.emulateMedia({ colorScheme });
      await page.goto("/");
      const html = page.locator("html");
      if (dark) await expect(html).toHaveClass(/\bdark\b/);
      else await expect(html).not.toHaveClass(/\bdark\b/);
      expect(warnings).toEqual([]);
    });
  }

  test("el interruptor del pie activa dark y la elección sobrevive a la recarga", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    const html = page.locator("html");
    const toggle = page.getByRole("switch", { name: "Modo oscuro" });
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await toggle.click();
    await expect(html).toHaveClass(/\bdark\b/);
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await page.reload();
    await expect(html).toHaveClass(/\bdark\b/);
    await expect(page.getByRole("switch", { name: "Modo oscuro" })).toHaveAttribute("aria-checked", "true");
  });
});

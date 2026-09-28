import { expect, test, type Page } from "@playwright/test";

const PRODUCT_SLUG = "acetaminofen-500-mg-20-tabletas";
const PRODUCT_PATH = `/p/${PRODUCT_SLUG}`;

test.beforeEach(async ({ context }) => {
  await context.route("https://wa.me/**", (route) => route.abort());
  await context.route("https://www.google.com/maps/**", (route) => route.abort());
});

async function jsonLdOfType(page: Page, type: string): Promise<Record<string, unknown>> {
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  const objects = scripts.map((text) => JSON.parse(text) as Record<string, unknown>);
  const found = objects.find((object) => object["@type"] === type);
  if (found === undefined) throw new Error(`sin JSON-LD de tipo ${type}`);
  return found;
}

test("la búsqueda lleva al producto con destacadas y ofertas por precio", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox", { name: "Buscar productos" }).fill("acetaminofen");
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page).toHaveURL("/buscar?q=acetaminofen");
  await page.getByRole("link", { name: /Acetaminofén 500 mg x 20 tabletas/ }).first().click();

  await expect(page).toHaveURL(PRODUCT_PATH);
  const offers = page.getByRole("list", { name: "Ofertas" });
  await expect(offers.getByText("Destacado", { exact: true })).toHaveCount(2);
  const regular = offers.getByRole("listitem").filter({ hasNotText: "Destacado" });
  await expect(regular.nth(0)).toContainText("$ 2,35");
  await expect(regular.nth(1)).toContainText("$ 2,40");
});

test("el clic en WhatsApp registra click_whatsapp con el producto y la tienda", async ({ page }) => {
  await page.goto(PRODUCT_PATH);
  const firstWhatsapp = page.getByRole("link", { name: /^WhatsApp de / }).first();
  await expect(firstWhatsapp).toBeVisible();

  const eventResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/events") &&
      response.request().method() === "POST" &&
      (response.request().postData() ?? "").includes("click_whatsapp"),
  );
  await firstWhatsapp.click();

  const response = await eventResponse;
  expect(response.status()).toBe(202);
  expect(JSON.parse(response.request().postData() ?? "{}")).toEqual({
    type: "click_whatsapp",
    store_slug: "farmacia-central-valencia",
    product_slug: PRODUCT_SLUG,
  });
});

test("el producto tiene canónica y JSON-LD Product con cuatro ofertas", async ({ page }) => {
  await page.goto(PRODUCT_PATH);

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `http://localhost:3000${PRODUCT_PATH}`,
  );
  const product = await jsonLdOfType(page, "Product");
  expect((product.offers as Record<string, unknown>).offerCount).toBe(4);
});

test("un slug viejo termina en el slug vigente", async ({ page }) => {
  await page.goto("/p/acetaminofen-500mg-x-20");

  await expect(page).toHaveURL(PRODUCT_PATH);
});

test("un producto sin ofertas muestra sin disponibilidad y lleva noindex", async ({ page }) => {
  await page.goto("/p/jarabe-para-la-tos-120-ml");

  await expect(page.getByText("Sin disponibilidad ahora.")).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("la tienda tiene canónica sin parámetros, JSON-LD Store y horario", async ({ page }) => {
  await page.goto("/tienda/farmacia-central-valencia?pagina=2");

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "http://localhost:3000/tienda/farmacia-central-valencia",
  );
  await jsonLdOfType(page, "Store");
  await expect(page.getByText("Lun a Sáb: 08:00 a 20:00")).toBeVisible();
});

test("robots excluye /buscar y apunta a los sitemaps partidos", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /buscar");
  expect(robots).toContain("Sitemap: http://localhost:3000/sitemap/products-1.xml");

  const sitemap = await (await request.get("/sitemap/products-1.xml")).text();
  expect(sitemap).toContain(PRODUCT_PATH);
  expect(sitemap).not.toContain("jarabe-para-la-tos-120-ml");
});

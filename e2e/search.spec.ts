import { expect, test } from "@playwright/test";
import { SITE_NAME } from "../lib/site";

test("la portada lleva a la búsqueda con resultados, tasa y noindex", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Encuentra lo que necesitas al mejor precio cerca de ti" }),
  ).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Salud y medicamentos", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: `Productos en ${SITE_NAME}` })).toBeVisible();
  await expect(page.getByRole("heading", { name: `Comercios en ${SITE_NAME}` })).toBeVisible();
  await expect(page.getByText("PATROCINADO")).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "http://localhost:3000");

  await page.getByRole("combobox", { name: "Buscar productos" }).fill("acetaminofen");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();

  await expect(page).toHaveURL("/buscar?q=acetaminofen");
  await expect(page.getByRole("list", { name: "Resultados" }).getByRole("link").first()).toBeVisible();
  await expect(page.getByText(/^Tasa BCV del/)).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("una búsqueda sin resultados ofrece el enlace a comercios", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox", { name: "Buscar productos" }).fill("zzzz");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();

  await expect(page.getByRole("heading", { name: "No encontramos resultados para «zzzz»." })).toBeVisible();
  await expect(page.locator('a[href="/comercios"]').first()).toBeVisible();
});

test("elegir ciudad la guarda y la búsqueda ofrece sólo la ciudad o todo el país", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Buscar cerca de Elegir ubicación" }).click();
  await page.getByRole("button", { name: "Elegir ciudad" }).click();
  await page.getByRole("combobox", { name: "Estado" }).click();
  await page.getByRole("option", { name: "Carabobo", exact: true }).click();
  await page.getByRole("combobox", { name: "Municipio" }).click();
  await page.getByRole("option", { name: "Valencia", exact: true }).click();
  await page.getByRole("combobox", { name: "Ciudad" }).click();
  await page.getByRole("option", { name: "Valencia", exact: true }).click();
  await page.getByRole("button", { name: "Guardar" }).click();

  await expect(page.getByRole("button", { name: "Buscar cerca de Valencia" })).toBeVisible();

  await page.goto("/buscar?q=acetaminofen");
  await page.getByRole("button", { name: "Filtros" }).click();
  await expect(page.getByRole("link", { name: "Sólo Valencia" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Todo el país" })).toBeVisible();
});

test.describe("con geolocalización concedida", () => {
  test.use({
    geolocation: { latitude: 10.162, longitude: -68.007 },
    permissions: ["geolocation"],
  });

  test("usar mi ubicación muestra la ubicación actual", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Buscar cerca de Elegir ubicación" }).click();
    await page.getByRole("button", { name: "Usar mi ubicación" }).click();

    await expect(page.getByRole("button", { name: "Buscar cerca de Tu ubicación actual" })).toBeVisible();
  });
});

test("buscar en la página 1 registra search con el texto y el total de resultados", async ({ page }) => {
  // Playwright no expone el cuerpo de un sendBeacon; sin él, el beacon cae a fetch.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "sendBeacon", { value: undefined });
  });
  const eventResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/events") &&
      response.request().method() === "POST" &&
      (response.request().postData() ?? "").includes('"search"'),
  );
  await page.goto("/buscar?q=Acetaminofen");

  const response = await eventResponse;
  expect(response.status()).toBe(202);
  const body = JSON.parse(response.request().postData() ?? "{}");
  expect(body).toMatchObject({
    type: "search",
    store_slug: null,
    product_slug: null,
    query: "Acetaminofen",
    category_slug: null,
  });
  expect(body.results_count).toBeGreaterThan(0);
});

test("el buscador sugiere con el teclado y recuerda las búsquedas recientes", async ({ page }) => {
  await page.goto("/");
  const box = page.getByRole("combobox", { name: "Buscar productos" });
  await box.fill("acet");
  const listbox = page.getByRole("listbox", { name: "Sugerencias de búsqueda" });
  await expect(listbox.getByRole("option").first()).toBeVisible();
  await expect(box).toHaveAttribute("aria-expanded", "true");

  await box.press("ArrowDown");
  await box.press("Enter");
  await expect(page).toHaveURL(/\/buscar\?q=/);

  await page.goto("/");
  await page.getByRole("combobox", { name: "Buscar productos" }).focus();
  await expect(page.getByRole("option").first()).toBeVisible();
  await expect(page.getByText("Recientes")).toBeVisible();
});

test("cambiar el orden a menor precio lo escribe en la URL y ordena los resultados por precio", async ({ page }) => {
  await page.goto("/buscar?categoria=salud-y-medicamentos");
  await expect(page.getByRole("navigation", { name: "Migas de pan" })).toBeVisible();

  await page.getByRole("navigation", { name: "Ordenar por" }).getByRole("link", { name: "Menor precio" }).click();

  await expect(page).toHaveURL(/orden=precio/);
  await expect(
    page.getByRole("navigation", { name: "Ordenar por" }).getByRole("link", { name: "Menor precio" }),
  ).toHaveAttribute("aria-current", "true");
  const cards = await page.getByRole("list", { name: "Resultados" }).getByRole("link").allInnerTexts();
  const prices = cards.map((text) => Number((/\$\s*(\d+[.,]\d{2})/.exec(text) ?? [])[1]?.replace(",", ".")));
  expect(prices.length).toBeGreaterThan(1);
  expect(prices).toEqual([...prices].sort((a, b) => a - b));
});

test("abierto ahora se activa desde la hoja de filtros y Limpiar filtros lo quita", async ({ page }) => {
  await page.goto("/buscar?q=acetaminofen");
  await expect(page.getByRole("navigation", { name: "Filtros activos" })).toHaveCount(0);

  await page.getByRole("button", { name: "Filtros" }).click();
  await page.getByRole("link", { name: "Abierto ahora desactivado" }).click();

  await expect(page).toHaveURL(/abierto=1/);
  const active = page.getByRole("navigation", { name: "Filtros activos" });
  await expect(active.getByRole("link", { name: "Quitar filtro Abierto ahora" })).toBeVisible();

  await active.getByRole("link", { name: "Limpiar filtros" }).click();

  await expect(page).not.toHaveURL(/abierto=1/);
  await expect(page.getByRole("navigation", { name: "Filtros activos" })).toHaveCount(0);
});

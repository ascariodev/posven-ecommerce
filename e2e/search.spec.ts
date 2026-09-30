import { expect, test } from "@playwright/test";
import { SITE_NAME } from "../lib/site";

test("la portada lleva a la búsqueda con resultados, tasa y noindex", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Encuentra lo que buscas en tiendas cerca de ti" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Salud y medicamentos", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: `Tiendas en ${SITE_NAME}` })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "http://localhost:3000");

  await page.getByRole("searchbox", { name: "Buscar productos" }).fill("acetaminofen");
  await page.getByRole("button", { name: "Buscar" }).click();

  await expect(page).toHaveURL("/buscar?q=acetaminofen");
  await expect(page.getByRole("list", { name: "Resultados" }).getByRole("link").first()).toBeVisible();
  await expect(page.getByText(/^Tasa BCV del/)).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("una búsqueda sin resultados ofrece el enlace a comercios", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox", { name: "Buscar productos" }).fill("zzzz");
  await page.getByRole("button", { name: "Buscar" }).click();

  await expect(page.getByRole("heading", { name: "No encontramos resultados para «zzzz»." })).toBeVisible();
  await expect(page.locator('a[href="/comercios"]').first()).toBeVisible();
});

test("elegir ciudad la guarda y la búsqueda ofrece sólo la ciudad o todo el país", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ubicación: sin elegir" }).click();
  await page.getByRole("button", { name: "Elegir ciudad" }).click();
  await page.getByRole("combobox", { name: "Estado" }).click();
  await page.getByRole("option", { name: "Carabobo", exact: true }).click();
  await page.getByRole("combobox", { name: "Municipio" }).click();
  await page.getByRole("option", { name: "Valencia", exact: true }).click();
  await page.getByRole("combobox", { name: "Ciudad" }).click();
  await page.getByRole("option", { name: "Valencia", exact: true }).click();
  await page.getByRole("button", { name: "Guardar" }).click();

  await expect(page.getByRole("button", { name: "Ubicación: Valencia" })).toBeVisible();

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
    await page.getByRole("button", { name: "Ubicación: sin elegir" }).click();
    await page.getByRole("button", { name: "Usar mi ubicación" }).click();

    await expect(page.getByRole("button", { name: "Ubicación: Tu ubicación actual" })).toBeVisible();
  });
});

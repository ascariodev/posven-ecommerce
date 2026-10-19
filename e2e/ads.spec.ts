import { expect, test, type Page } from "@playwright/test";

async function setAdsMode(page: Page, value: "none" | "down") {
  await page.context().addCookies([{ name: "mock_ads", value, url: "http://localhost:3000" }]);
}

test("la portada con anuncio muestra Patrocinado y la pieza", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Patrocinado").first()).toBeVisible();
  await expect(page.getByAltText("Anuncio simulado del hero").first()).toBeAttached();
});

test("la portada sin anuncios conserva el hero y las tarjetas de categoría de siempre", async ({ page }) => {
  await setAdsMode(page, "none");
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /Salud y medicamentos/ }).first()).toBeVisible();
  await expect(page.locator('a[href="https://anunciante.example/promo"]')).toHaveCount(0);
  await expect(page.getByAltText("Anuncio simulado del hero")).toHaveCount(0);
});

test("la portada carga con la API de placements caída", async ({ page }) => {
  await setAdsMode(page, "down");
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /Salud y medicamentos/ }).first()).toBeVisible();
  await expect(page.locator('a[href="https://anunciante.example/promo"]')).toHaveCount(0);
});

test("un anuncio con destino externo lleva rel sponsored noopener y target _blank", async ({ page }) => {
  await page.goto("/");
  const link = page.locator('a[href="https://anunciante.example/promo"]').first();
  await expect(link).toBeAttached();
  const rel = (await link.getAttribute("rel")) ?? "";
  expect(rel).toContain("sponsored");
  expect(rel).toContain("noopener");
  await expect(link).toHaveAttribute("target", "_blank");
});

test("ver el anuncio de la portada registra ad_impression con su ad_token", async ({ page }) => {
  // Playwright no expone el cuerpo de un sendBeacon; sin él, el beacon cae a fetch.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "sendBeacon", { value: undefined });
  });
  const eventResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/events") &&
      response.request().method() === "POST" &&
      (response.request().postData() ?? "").includes('"ad_impression"'),
  );
  await page.goto("/");

  const response = await eventResponse;
  expect(response.status()).toBe(202);
  const body = JSON.parse(response.request().postData() ?? "{}");
  expect(body.type).toBe("ad_impression");
  expect(body.ad_token).toMatch(/^ad-simulado-/);
});

import { expect, test } from "@playwright/test";

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

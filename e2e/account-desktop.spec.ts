import { expect, test, type Page } from "@playwright/test";
import { fillRegistration } from "./registration";

// El proyecto "Pixel 7" corre en móvil, donde "Compras recientes" son filas; la tabla sólo existe
// desde `md`. Este archivo fuerza un viewport de escritorio para cubrirla.
test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });

const ACETAMINOFEN_PATH = "/p/acetaminofen-500-mg-20-tabletas";

async function verifyEmail(page: Page): Promise<void> {
  await expect(async () => {
    await page.goto("/cuenta");
    if ((await page.getByText("no está verificado").count()) > 0) {
      await page.getByRole("button", { name: "Reenviar verificación" }).first().click();
      await expect(page.getByRole("button", { name: "Reenviar verificación" }).first()).toBeEnabled();
      await page.goto("/verificar/verificacion-simulada");
      await page.getByRole("button", { name: "Verificar mi correo" }).click();
      await expect(page.getByText("Tu correo quedó verificado.")).toBeVisible();
      await page.goto("/cuenta");
    }
    await expect(page.getByText("no está verificado")).toHaveCount(0);
  }).toPass({ timeout: 30_000 });
}

async function clickPay(page: Page): Promise<void> {
  const pay = page.getByRole("button", { name: /^Pagar Bs / });
  await expect(pay).toBeEnabled();
  await expect
    .poll(() => pay.evaluate((node) => Object.keys(node).some((key) => key.startsWith("__reactProps$"))), { timeout: 15_000 })
    .toBe(true);
  await pay.click();
}

test("en escritorio, Compras recientes es una tabla con la compra y Tu última compra enlaza al seguimiento", async ({ page }) => {
  await page.goto(ACETAMINOFEN_PATH);
  await page.getByRole("button", { name: /^Agregar (al carrito|otro): .* de Farmacia Central$/ }).click();
  await expect(page.getByText("Agregado").first()).toBeVisible();

  await page.goto("/registro");
  await fillRegistration(page, {
    name: "Escritorio E2E",
    email: `e2e-escritorio-${Date.now()}@posven.test`,
    phone: "04141112266",
    password: "clave-segura-5",
  });
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await expect(page).toHaveURL("/cuenta");
  await verifyEmail(page);

  await page.goto("/checkout");
  await clickPay(page);
  await expect(page).toHaveURL(/\/checkout\/resultado\?compra=[A-HJKMNP-Z2-9]{8}$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1, name: "¡Pago confirmado!" })).toBeVisible({ timeout: 15_000 });
  const code = new URL(page.url()).searchParams.get("compra");

  await page.goto("/cuenta");
  const table = page.getByRole("table", { name: "Compras recientes" });
  await expect(table).toBeVisible();
  await expect(table.getByRole("columnheader")).toHaveText(["Código", "Fecha", "Tiendas", "Total", "Estado"]);
  const row = table.getByRole("row").filter({ hasText: code ?? "" });
  await expect(row).toHaveCount(1);
  await expect(row.getByRole("link", { name: code ?? "" })).toHaveAttribute("href", `/cuenta/compras/${code}`);
  await expect(page.getByRole("list", { name: "Compras recientes" })).toBeHidden();

  await expect(page.getByRole("link", { name: "Ver seguimiento" })).toHaveAttribute("href", `/cuenta/compras/${code}`);
});

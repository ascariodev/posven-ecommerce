import { expect, type Page } from "@playwright/test";

// El simulado guarda una sola verificación pendiente para todo el servidor y otros archivos del e2e
// registran compradores en paralelo: se pide de nuevo justo antes de verificar, hasta que quede.
export async function verifyEmail(page: Page): Promise<void> {
  await expect(async () => {
    await page.goto("/cuenta");
    const notice = page.getByText("no está verificado");
    if ((await notice.count()) > 0) {
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

// React marca con __reactProps$ cada nodo del DOM que ya hidrató. Con el servidor recién arrancado
// un clic en "Pagar" antes de eso no dispara la acción; se espera la marca y recién se hace el clic
// (uno solo: no se reintenta, para no pagar dos veces).
export async function clickPay(page: Page): Promise<void> {
  const pay = page.getByRole("button", { name: /^Pagar Bs / });
  await expect(pay).toBeEnabled();
  await expect
    .poll(() => pay.evaluate((node) => Object.keys(node).some((key) => key.startsWith("__reactProps$"))), { timeout: 15_000 })
    .toBe(true);
  await pay.click();
}

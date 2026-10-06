import { expect, type Locator, type Page } from "@playwright/test";

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

// React marca con __reactProps$ cada nodo del DOM que ya hidrató. Con el servidor recién compilado
// un clic o un campo llenado antes de eso se pierde; se espera la marca antes de actuar.
export async function waitHydrated(target: Locator): Promise<void> {
  await expect
    .poll(() => target.evaluate((node) => Object.keys(node).some((key) => key.startsWith("__reactProps$"))), { timeout: 30_000 })
    .toBe(true);
}

// Un solo clic tras hidratar: no se reintenta, para no repetir acciones con efecto (pagar, agregar).
export async function clickHydrated(target: Locator): Promise<void> {
  await waitHydrated(target);
  await target.click();
}

export async function clickPay(page: Page): Promise<void> {
  const pay = page.getByRole("button", { name: /^Pagar Bs / });
  await expect(pay).toBeEnabled();
  await clickHydrated(pay);
}

export async function openLocationSheet(page: Page): Promise<void> {
  await clickHydrated(page.getByRole("button", { name: /^Buscar cerca de / }));
}

export async function submitSignIn(page: Page, email: string, password: string): Promise<void> {
  const submit = page.getByRole("button", { name: "Entrar", exact: true });
  await waitHydrated(submit);
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await submit.click();
}

export async function waitRegistrationHydrated(page: Page): Promise<void> {
  await waitHydrated(page.getByRole("button", { name: "Crear cuenta", exact: true }));
}

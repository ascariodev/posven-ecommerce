import { expect, test, type Page } from "@playwright/test";
import { clickHydrated, clickPay, submitSignIn, verifyEmail, waitRegistrationHydrated } from "./helpers";
import { fillRegistration } from "./registration";

// Spec cuentas-y-compras §7: registrar, verificar, carrito de invitado, entrar, fusionar, pagar,
// ver la compra y el código, reembolso de una línea faltante. El simulado avanza la compra por
// consultas del detalle (plan 4b, decisión 4) y el alcohol de Farmacia Central sale faltante.
// Cuentas sembradas propias: entrega@posven.test y pago-fallido@posven.test (clave-segura-3).

const ACETAMINOFEN_PATH = "/p/acetaminofen-500-mg-20-tabletas";
const ALCOHOL_PATH = "/p/alcohol-isopropilico-250-ml";
const HARINA_PATH = "/p/harina-de-maiz-precocida-1-kg";
const SEEDED_PASSWORD = "clave-segura-3";

async function add(page: Page, path: string, store: string): Promise<void> {
  await page.goto(path);
  await expect(page.locator("[data-purchase-bar]")).toBeVisible();
  const pick = page.getByRole("button", { name: new RegExp(`^Elegir tienda: ${store},`) });
  if ((await pick.count()) > 0) await clickHydrated(pick);
  await clickHydrated(
    page
      .locator("[data-purchase-bar]")
      .getByRole("button", { name: new RegExp(`^Agregar (al carrito|otro) de la tienda elegida: .* de ${store}$`) }),
  );
  await expect(page.getByText("Agregado").first()).toBeVisible();
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/entrar");
  await submitSignIn(page, email, password);
  await expect(page).toHaveURL("/cuenta");
}

async function register(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/registro");
  await waitRegistrationHydrated(page);
  await fillRegistration(page, { name: "Compra E2E", email, phone: "04141112255", password });
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await expect(page).toHaveURL("/cuenta");
}

// Las cuentas sembradas conservan su carrito entre corridas: se vacía al terminar para que el e2e
// sea repetible (el stock simulado topa las cantidades).
async function emptyCart(page: Page): Promise<void> {
  await page.goto("/carrito");
  const remove = page.getByRole("button", { name: /^Quitar: / });
  // El carrito llega en streaming: sin esta espera el conteo ve el esqueleto, da 0 y no vacía nada.
  await expect(remove.first().or(page.getByText("Tu carrito está vacío."))).toBeVisible();
  while ((await remove.count()) > 0) {
    const before = await remove.count();
    await remove.first().click();
    await expect(remove).toHaveCount(before - 1);
  }
}

function cartLink(page: Page, name: string) {
  return page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name, exact: true });
}

test.describe("checkout y compras", () => {
  test.describe.configure({ mode: "serial" });

  test("compra completa: pagar, ver el código de retiro y el reembolso de la línea faltante", async ({ page }) => {
    const email = `e2e-compra-${Date.now()}@posven.test`;
    const password = "clave-segura-4";

    await add(page, ACETAMINOFEN_PATH, "Farmacia Central");
    await add(page, ALCOHOL_PATH, "Farmacia Central");
    await register(page, email, password);
    await expect(cartLink(page, "Carrito, 2 productos")).toBeVisible();
    await verifyEmail(page);

    await page.goto("/carrito");
    await page.getByRole("link", { name: "Ir a pagar" }).click();
    await expect(page).toHaveURL("/checkout");
    await expect(page.getByRole("list", { name: "Productos de Farmacia Central" })).toBeVisible();
    await expect(page.getByText("Agrega una dirección para pedir entrega.")).toBeVisible();
    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflows).toBe(false);

    await clickPay(page);
    await expect(page).toHaveURL(/\/checkout\/resultado\?compra=[A-HJKMNP-Z2-9]{8}$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 1, name: "¡Pago confirmado!" })).toBeVisible({ timeout: 15_000 });

    await expect(page.getByRole("list", { name: "Estado del pedido" })).toBeVisible();
    const code = new URL(page.url()).searchParams.get("compra");
    await page.getByRole("link", { name: "Ver mis compras" }).click();
    await expect(page).toHaveURL(/\/cuenta\/compras$/);
    await page.goBack();
    await page.getByRole("link", { name: "Ver detalle del pedido" }).click();
    await expect(page).toHaveURL(new RegExp(`/cuenta/compras/${code}$`));
    await expect(page).toHaveURL(/\/cuenta\/compras\/[A-HJKMNP-Z2-9]{8}$/);
    await expect(async () => {
      await page.reload();
      await expect(page.getByText("Código de retiro", { exact: true })).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 20_000 });
    await expect(page.getByText(/^[A-HJKMNP-Z2-9]{6}$/)).toBeVisible();
    const lines = page.getByRole("list", { name: "Productos de Farmacia Central" }).getByRole("listitem");
    await expect(lines.filter({ hasText: "Alcohol" })).toContainText("Faltante · reembolsado");
    await expect(lines.filter({ hasText: "Acetaminofén" })).not.toContainText("Faltante");
    await expect(page.getByText("Reembolsado", { exact: true })).toBeVisible();

    await page.goto("/cuenta");
    await expect(page.getByRole("list", { name: "Compras recientes" }).getByRole("link")).toHaveCount(1);
    const buyAgain = page.getByRole("list", { name: "Volver a comprar" });
    await expect(buyAgain.getByRole("link", { name: /^Acetaminofén/ })).toBeVisible();
    await expect(buyAgain.getByRole("link", { name: /Alcohol/ })).toHaveCount(0);
    await clickHydrated(buyAgain.getByRole("button", { name: /^Agregar al carrito: Acetaminofén/ }));
    await expect(buyAgain.getByText("Agregado")).toBeVisible();
    await expect(cartLink(page, "Carrito, 1 producto")).toBeVisible();

    await page.goto("/cuenta/configuracion");
    const deleteForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Eliminar mi cuenta" }) });
    await deleteForm.getByLabel("Contraseña").fill(password);
    await deleteForm.getByRole("button", { name: "Eliminar mi cuenta" }).click();
    await expect(page.getByText("Tienes pedidos en curso. Podrás eliminar tu cuenta cuando se entreguen.")).toBeVisible();
  });

  test("sin el correo verificado no se puede pagar", async ({ page }) => {
    await add(page, ACETAMINOFEN_PATH, "Farmacia Central");
    await register(page, `e2e-sin-verificar-${Date.now()}@posven.test`, "clave-segura-4");

    await page.goto("/checkout");
    await expect(page.getByText("Verifica tu correo para comprar.")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Pagar/ })).toHaveCount(0);
  });

  test("Factura a mi nombre: deshabilitada sin datos, marcada con datos, y borrar los datos deja los campos vacíos", async ({ page }) => {
    await add(page, ACETAMINOFEN_PATH, "Farmacia Central");
    await register(page, `e2e-factura-${Date.now()}@posven.test`, "clave-segura-4");
    await verifyEmail(page);
    const box = page.getByRole("checkbox", { name: "Factura a mi nombre" });

    await page.goto("/cuenta/perfil");
    await page.getByRole("button", { name: "Borrar mis datos de facturación" }).click();
    await expect(page.getByRole("button", { name: "Borrar mis datos de facturación" })).toBeDisabled();

    await page.goto("/checkout");
    await expect(box).toBeDisabled();
    await expect(box).not.toBeChecked();
    await page.getByRole("link", { name: "Agregar mis datos" }).click();
    await expect(page).toHaveURL("/cuenta/perfil");

    await page.getByLabel("Tipo de documento").click();
    await page.getByRole("option", { name: /^V / }).click();
    await page.getByLabel("Documento", { exact: true }).fill("12345678");
    await page.getByLabel("Nombre o razón social").fill("Comprador Facturado");
    await page.getByLabel("Teléfono").last().fill("04141234567");
    await page.getByLabel("Dirección fiscal").fill("Avenida Bolívar, edificio Central, Valencia");
    await page.getByLabel("Tipo de contribuyente").click();
    await page.getByRole("option", { name: "Ordinario" }).click();
    await page.getByRole("button", { name: "Guardar datos de facturación" }).click();
    await expect(page.getByRole("button", { name: "Borrar mis datos de facturación" })).toBeEnabled();

    await page.goto("/checkout");
    await expect(box).toBeEnabled();
    await expect(box).toBeChecked();

    await page.goto("/cuenta/perfil");
    await page.getByRole("button", { name: "Borrar mis datos de facturación" }).click();
    await expect(page.getByRole("button", { name: "Borrar mis datos de facturación" })).toBeDisabled();
    await expect(page.getByLabel("Documento", { exact: true })).toHaveValue("");
    await expect(page.getByLabel("Nombre o razón social")).toHaveValue("");
    await expect(page.getByLabel("Dirección fiscal")).toHaveValue("");

    await page.goto("/checkout");
    await expect(box).toBeDisabled();
  });

  test("la entrega a domicilio suma el envío donde la tienda reparte", async ({ page }) => {
    await signIn(page, "entrega@posven.test", SEEDED_PASSWORD);
    await add(page, ACETAMINOFEN_PATH, "Farmacia Central");
    await add(page, HARINA_PATH, "Abasto La Esquina");

    await page.goto("/checkout");
    await expect(page.getByText("Esta tienda no hace entregas.")).toBeVisible();
    await expect(page.getByText("Envío")).toHaveCount(0);
    await page
      .getByRole("radiogroup", { name: "Entrega en Farmacia Central" })
      .getByRole("radio", { name: "Entrega a domicilio" })
      .click();

    await expect(page).toHaveURL(/f-farmacia-central-valencia=delivery/);
    await expect(page.getByText("Envío")).toBeVisible();
    await expect(page.getByText("$ 1,50 · Bs 54,75")).toBeVisible();

    await emptyCart(page);
  });

  test("entrega elegida en el carrito: viaja al checkout, se paga y el seguimiento sale con los pasos de entrega", async ({ page }) => {
    await signIn(page, "entrega@posven.test", SEEDED_PASSWORD);
    await emptyCart(page);
    await add(page, ACETAMINOFEN_PATH, "Farmacia Central");

    await page.goto("/carrito");
    await page.getByRole("navigation", { name: "Cómo recibir lo de Farmacia Central" }).getByRole("link", { name: /^Entrega/ }).click();
    await expect(page).toHaveURL(/\/carrito\?f-farmacia-central-valencia=delivery/);
    await expect(page.getByRole("navigation", { name: "Cómo recibir lo de Farmacia Central" }).getByRole("link", { name: /^Entrega/ })).toHaveAttribute("aria-current", "true");

    await page.getByRole("link", { name: "Ir a pagar" }).click();
    await expect(page).toHaveURL(/\/checkout\?.*f-farmacia-central-valencia=delivery/);
    await expect(
      page.getByRole("radiogroup", { name: "Entrega en Farmacia Central" }).getByRole("radio", { name: "Entrega a domicilio" }),
    ).toBeChecked();
    await expect(page.getByText("Envío")).toBeVisible();

    await clickPay(page);
    await expect(page).toHaveURL(/\/checkout\/resultado\?compra=[A-HJKMNP-Z2-9]{8}$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 1, name: "¡Pago confirmado!" })).toBeVisible({ timeout: 15_000 });
    const steps = page.getByRole("list", { name: "Estado del pedido" });
    await expect(steps).toHaveCount(1);
    await expect(steps).toContainText("Preparando");
    await expect(steps).toContainText("En camino");
    await expect(steps).not.toContainText("Listo para retirar");

    await page.getByRole("link", { name: "Seguir comprando" }).click();
    await expect(page).toHaveURL("/");
    await emptyCart(page);
  });

  test("un pago fallido lo dice y deja el carrito igual", async ({ page }) => {
    await signIn(page, "pago-fallido@posven.test", SEEDED_PASSWORD);
    await add(page, ACETAMINOFEN_PATH, "Farmacia Central");
    await page.goto("/carrito");
    const quantity = await page.getByRole("group", { name: /^Cantidad de Acetaminofén/ }).textContent();

    await page.goto("/checkout");
    await clickPay(page);
    await expect(page.getByRole("heading", { level: 1, name: "El pago no se completó" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Tu carrito sigue igual.")).toBeVisible();

    await page.getByRole("link", { name: "Volver al carrito" }).click();
    await expect(page.getByRole("group", { name: /^Cantidad de Acetaminofén/ })).toHaveText(quantity ?? "");

    await emptyCart(page);
  });

  test("/checkout y /checkout/resultado llevan noindex y robots excluye /checkout", async ({ page, request }) => {
    await signIn(page, "entrega@posven.test", SEEDED_PASSWORD);
    await page.goto("/checkout");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await page.goto("/checkout/resultado?compra=ZZZZZZZZ");
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);

    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("/checkout");
  });
});

import type { Page } from "@playwright/test";

export async function fillRegistration(
  page: Page,
  data: { name: string; email: string; phone: string; password: string },
): Promise<void> {
  await page.getByLabel("Tipo de documento").click();
  await page.getByRole("option", { name: /^V / }).click();
  await page.getByLabel("Documento", { exact: true }).fill("12345678");
  await page.getByLabel("Nombre o razón social").fill(data.name);
  await page.getByLabel("Correo").fill(data.email);
  await page.getByLabel("Teléfono").fill(data.phone);
  await page.getByLabel("Contraseña").fill(data.password);
  await page.getByLabel("Dirección fiscal").fill("Avenida Bolívar, edificio Central, Valencia");
  await page.getByLabel("Tipo de contribuyente").click();
  await page.getByRole("option", { name: "Ordinario" }).click();
}

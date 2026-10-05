---
module: "merchants"
path: "features/merchants"
type: "feature"
exports: ["MerchantsLanding", "ExampleStoreCard", "MERCHANT_STEPS", "MERCHANT_BENEFITS", "MERCHANT_QUESTIONS", "EXAMPLE_PRICE_USD", "EXAMPLE_DISTANCE_KM", "MerchantStep", "MerchantBenefit", "MerchantBenefitIcon", "MerchantQuestion"]
depends_on: ["features/site/components/MerchantContact.tsx", "components/ui/button.tsx", "components/ui/card.tsx", "lib/format.ts", "lib/site.ts", "lib/utils.ts", "lib/marketplace/schemas.ts"]
tests: "features/merchants/__tests__/*.test.{ts,tsx}"
verified_against: ["features/merchants/lib/content.ts", "features/merchants/components/MerchantsLanding.tsx", "features/merchants/components/ExampleStoreCard.tsx", "features/merchants/__tests__/content.test.ts", "features/merchants/__tests__/MerchantsLanding.test.tsx", "app/vende/page.tsx", "features/site/components/MerchantContact.tsx", "lib/format.ts", "lib/site.ts", "lib/sitemap.ts", "e2e/site.spec.ts"]
capabilities:
  - intent: "explicar a un comercio cómo aparecer en el buscador y darle un contacto"
    intent_aliases: ["vende con nosotros", "para comercios", "captar comercios", "landing de comercios", "quiero aparecer", "registrar mi comercio"]
    entrypoint: "<MerchantsLanding whatsapp={string | null} email={string | null} />"
    file: "features/merchants/components/MerchantsLanding.tsx"
    input: "whatsapp (dígitos) y email, cada uno string o null; app/vende/page.tsx los toma de merchantWhatsapp() y merchantEmail()"
    output: "héroe sobre bg-ink con la tarjeta de ejemplo, tres pasos, tres beneficios, preguntas plegables en <details> y banda final; los CTA 'Quiero aparecer' y la banda sólo aparecen con un destino de contacto"
    source: "datos estáticos de features/merchants/lib/content.ts; el destino sale de merchantContactHref de features/site"
    rules: ["RN-MERCHANTS-01", "RN-MERCHANTS-02", "RN-MERCHANTS-03"]
---

# Módulo `merchants`

## 1. Propósito

Contenido de `/vende`, la página que explica a un comercio cómo aparecer en el buscador: héroe
con una tarjeta de ejemplo, pasos, beneficios, preguntas y un contacto. No llama a la API, no
registra comercios ni dice cuánto cuesta aparecer ni cuándo se liquida el dinero.

## 2. Reglas de negocio

| Regla | Enunciado | Test que la hace cumplir |
|---|---|---|
| `RN-MERCHANTS-01` | Toda pregunta de comercios cita en `source` la sección de la spec que sostiene su respuesta. | `features/merchants/__tests__/content.test.ts` ("cada pregunta cita una spec como fuente") |
| `RN-MERCHANTS-02` | Las preguntas no tratan el costo de aparecer ni la liquidación del dinero: no hay texto comprobable. | `features/merchants/__tests__/content.test.ts` ("no responde costo de aparecer ni liquidación del dinero") |
| `RN-MERCHANTS-03` | Sin `MERCHANT_WHATSAPP` ni `MERCHANT_EMAIL` la página no pinta ningún CTA ni la banda final. | `features/merchants/__tests__/MerchantsLanding.test.tsx` ("sin destino de contacto no muestra ningún CTA ni la banda final") |

Cada respuesta se apoya en la spec, y la fuente queda en `source`:

| Pregunta | Fuente |
|---|---|
| Otro sistema o cargar productos | spec hiperlocal §1 (decisión 5: los productos vendibles con stock se publican solos, con exclusión por producto) y §3.1 (`controlled` no se publica) |
| Vender en línea | spec cuentas y compras §1 (decisión 13: `accepts_orders` apagado por defecto) y spec hiperlocal §1 (decisión 2: el contacto por WhatsApp y llamada se queda) |
| Entregar a domicilio | spec cuentas y compras §1 (decisión 3: radio y costo fijo por tienda), §5.3 y §6 (fuera de radio, sólo retiro) |
| Récipe | spec hiperlocal §3.1 (regla 5: `recipe` con aviso y sin WhatsApp; llamar y ruta sí) |

Quedan fuera las preguntas "cuánto cuesta aparecer" y "cómo recibo el dinero de los pedidos": la
spec no fija precio, comisión ni calendario de liquidación para esta página.

Los pasos y beneficios se apoyan en la misma spec: publicación automática y por exclusión
(hiperlocal §1), inventario y precios sincronizados desde el TPV con "actualizado hace" (§1 y §3.1),
eventos de vistas y contactos que el comercio ve en su backoffice (`features/events`), orden por
precio o cercanía (§5.2) y venta en línea opcional.

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Un paso, beneficio o pregunta | `MERCHANT_STEPS`, `MERCHANT_BENEFITS` o `MERCHANT_QUESTIONS` en `lib/content.ts` | comprobarlo contra la spec, citar la fuente en `source` (preguntas) y en la tabla de la sección 2 |
| Diseño de la página y del contacto | `MerchantsLanding` en `components/MerchantsLanding.tsx` | `MerchantsLanding.test.tsx` y `e2e/site.spec.ts` |
| La tarjeta "Así te ven los compradores" | `ExampleStoreCard` en `components/ExampleStoreCard.tsx` y las constantes de ejemplo de `lib/content.ts` | los montos siguen saliendo de `lib/format.ts` |
| Metadatos o canónica | `app/vende/page.tsx` | la canónica sigue en `/vende`; entrada en el grupo `static` de `lib/sitemap.ts` |

## 4. API pública

- `MerchantsLanding({ whatsapp, email }: { whatsapp: string | null; email: string | null }): React.JSX.Element`, `features/merchants/components/MerchantsLanding.tsx`: Server Component; el destino de los CTA es `merchantContactHref(whatsapp, email)`.
- `ExampleStoreCard(): React.JSX.Element`, `features/merchants/components/ExampleStoreCard.tsx`: tarjeta de ejemplo; sus botones "Agregar" y "Llamar" son decorativos (`aria-hidden`).
- `MERCHANT_STEPS: MerchantStep[]`, `MERCHANT_BENEFITS: MerchantBenefit[]` y `MERCHANT_QUESTIONS: MerchantQuestion[]`, `features/merchants/lib/content.ts`: los datos.
- `EXAMPLE_PRICE_USD: Money` y `EXAMPLE_DISTANCE_KM: number`, `features/merchants/lib/content.ts`: valores de la tarjeta de ejemplo.
- `MerchantStep = { title: string; text: string }`, `MerchantBenefit = { icon: MerchantBenefitIcon; title: string; text: string }`, `MerchantBenefitIcon = "nearby" | "inventory" | "online"` y `MerchantQuestion = { id: string; question: string; answer: string; source: string }`, `features/merchants/lib/content.ts`.

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Datos | `lib/content.ts` | pasos, beneficios, preguntas con su fuente y valores de ejemplo |
| Página | `components/MerchantsLanding.tsx` | héroe, pasos, beneficios, preguntas en `<details>` y banda final |
| Tarjeta de ejemplo | `components/ExampleStoreCard.tsx` | tienda y oferta de muestra |

## 6. Dependencias

- `features/site/components/MerchantContact.tsx` (`merchantContactHref`), `lib/site.ts` (`POS_NAME`), `lib/format.ts` (`formatUsd`, `formatDistance`) y `lib/utils.ts` (`cn`).
- `lib/marketplace/schemas.ts` (tipo `Money`).
- `components/ui/button.tsx` (`buttonVariants`) y `components/ui/card.tsx`.
- `lucide-react` para los íconos.

## 7. Ejemplo de uso

```tsx
import { MerchantsLanding } from "@/features/merchants/components/MerchantsLanding";
import { merchantEmail, merchantWhatsapp } from "@/lib/site";

export default function SellPage() {
  return <MerchantsLanding whatsapp={merchantWhatsapp()} email={merchantEmail()} />;
}
```

## 8. Restricciones

- La tarjeta "Así te ven los compradores" es un ejemplo fijo, no datos de la API: el nombre del comercio, el producto, "Abierto", "Mejor precio", el precio (`EXAMPLE_PRICE_USD`) y la distancia (`EXAMPLE_DISTANCE_KM`) son de muestra. Los montos pasan por `lib/format.ts`, así que la distancia se muestra "a 800 m".
- Sin llamadas a la API; el contenido es estático y sin montos fuera de la tarjeta.
- Con sólo correo, los CTA son `mailto:`; con WhatsApp, `wa.me` con el mensaje de alta de comercio.
- Las preguntas plegables usan `<details>`, sin dependencia nueva.
- El héroe vive dentro del `max-w-5xl` del `<main>` del layout, como el resto del sitio.

## 9. Pruebas

- Comando: `npx --prefix <repo> vitest run --root <repo> features/merchants`
- `features/merchants/__tests__/content.test.ts`: fuente citada, temas excluidos e ids únicos.
- `features/merchants/__tests__/MerchantsLanding.test.tsx`: secciones, montos de ejemplo, CTA con y sin destino.
- `e2e/site.spec.ts`: `/vende` (canónica, secciones y CTA con destino).

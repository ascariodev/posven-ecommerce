---
module: "help"
path: "features/help"
type: "feature"
exports: ["HelpCenter", "HELP_TOPICS", "HELP_QUESTIONS", "filterQuestions", "HelpTopic", "HelpQuestion", "HelpTopicIcon"]
depends_on: ["components/EmptyState.tsx", "components/ui/card.tsx", "components/ui/input.tsx"]
tests: "features/help/__tests__/*.test.{ts,tsx}"
verified_against: ["features/help/lib/content.ts", "features/help/lib/filter.ts", "features/help/components/HelpCenter.tsx", "features/help/__tests__/content.test.ts", "features/help/__tests__/filter.test.ts", "features/help/__tests__/HelpCenter.test.tsx", "components/EmptyState.tsx", "features/product/components/OfferCard.tsx", "features/purchases/lib/labels.ts", "features/purchases/components/PurchaseDetail.tsx", "features/checkout/components/CheckoutStoreSection.tsx", "features/cart/components/CartStoreGroup.tsx", "features/product/components/ProductDetails.tsx", "lib/format.ts"]
capabilities:
  - intent: "buscar una respuesta en el centro de ayuda de compradores"
    intent_aliases: ["ayuda", "preguntas frecuentes", "faq", "buscar en la ayuda", "centro de ayuda", "soporte comprador"]
    entrypoint: "<HelpCenter />"
    file: "features/help/components/HelpCenter.tsx"
    input: "topics y questions opcionales (HelpTopic[] y HelpQuestion[]); por defecto HELP_TOPICS y HELP_QUESTIONS"
    output: "héroe con el buscador, temas con enlace a su primera pregunta, preguntas plegables en <details> y, si el texto no coincide con ninguna, el estado vacío 'Sin coincidencias'"
    source: "datos estáticos de features/help/lib/content.ts; el filtro corre en el navegador, sin API"
    rules: ["RN-HELP-01", "RN-HELP-02", "RN-HELP-03", "RN-HELP-04"]
---

# Módulo `help`

## 1. Propósito

Contenido y buscador del centro de ayuda para compradores: temas y preguntas frecuentes como datos
y un Client Component que filtra las preguntas por texto en el navegador. No llama a la API, no
monta la ruta ni la banda de contacto, y no trae la ayuda de comercios.

## 2. Reglas de negocio

| Regla | Enunciado | Test que la hace cumplir |
|---|---|---|
| `RN-HELP-01` | Toda pregunta cita en `source` la `RN-` o la spec que la sostiene. | `features/help/__tests__/content.test.ts` ("cada pregunta cita una RN- o una spec") |
| `RN-HELP-02` | Toda pregunta pertenece a un tema que existe. | `features/help/__tests__/content.test.ts` ("cada pregunta pertenece a un tema que existe") |
| `RN-HELP-03` | El filtro ignora mayúsculas y acentos y exige todos los términos escritos en la pregunta o en la respuesta; sin texto devuelve todas. | `features/help/__tests__/filter.test.ts`; `features/help/__tests__/HelpCenter.test.tsx` ("filtra por el texto escrito") |
| `RN-HELP-04` | Sin coincidencias se muestra el estado vacío "Sin coincidencias" en lugar de la lista. | `features/help/__tests__/HelpCenter.test.tsx` ("sin coincidencias muestra el estado vacío") |

Cada respuesta se apoya en lo que el sistema hace, y la fuente queda en `source`:

| Pregunta | Fuente |
|---|---|
| Los precios son los de la tienda | spec hiperlocal §1 y §3.1 (IVA incluido, frescura); `OfferCard.tsx` muestra "actualizado hace" con `formatUpdatedAgo` |
| Varias tiendas a la vez | spec cuentas y compras §1 (un cobro por compra, retiro o entrega por tienda) y §5.3; `RN-CHECKOUT-02` |
| La tienda no tiene el producto | spec cuentas y compras §5.2 (líneas `unavailable`) y §5.5 (faltante reembolsado); `RN-PURCHASES-02` |
| Precio en bolívares | spec hiperlocal §3.1 (tasa de la API) y tabla de casos (tasa del día); spec cuentas y compras (montos al pagar); `RN-CHECKOUT-02` |
| No termino de pagar | spec cuentas y compras §5.3 (30 minutos, `expired` y `failed`) y tabla de casos (pago tardío, `late_payment`); `RN-CHECKOUT-04` |
| Retiro del pedido | spec cuentas y compras §5.5 (`ready_for_pickup` manda el código); `RN-PURCHASES-02` y `RN-PURCHASES-04` |
| Costo de la entrega | spec cuentas y compras §1, §5.2 y §5.3 (radio y tarifa por tienda, fuera de radio sólo retiro); `RN-CHECKOUT-02`, `RN-ACCOUNT-06` |
| Necesito cuenta | `RN-CART-01`, `RN-CART-02`, `RN-CART-03`, `RN-CART-04`, `RN-CHECKOUT-01`; spec cuentas y compras §5.2 |
| Factura a mi nombre | `RN-CHECKOUT-05`; spec cuentas y compras §5.3 |
| Medicamentos con récipe | `RN-SEARCH-03`, `RN-CART-03`, `RN-EVENTS-03`; spec hiperlocal §3.1 (los `controlled` no se publican) |

Quedan fuera las preguntas sin respuesta comprobable: pagar en bolívares (la pasarela real no está
decidida en la spec) y devoluciones o cambios (no hay política en el código ni en la spec, sólo el
reembolso de faltantes).

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Una pregunta o respuesta nueva | `HELP_QUESTIONS` en `lib/content.ts` | citar su fuente en `source` y en la tabla de la sección 2; comprobarla contra el código |
| Un tema nuevo | `HELP_TOPICS` en `lib/content.ts` y su ícono en `TOPIC_ICONS` de `HelpCenter.tsx` | al menos una pregunta con ese `topic`: sin ella el tema no tiene enlace |
| Cómo se compara el texto | `filterQuestions` en `lib/filter.ts` | `filter.test.ts` |
| Diseño del buscador, temas o preguntas | `HelpCenter` en `components/HelpCenter.tsx` | `HelpCenter.test.tsx` |

## 4. API pública

- `HelpCenter({ topics?: HelpTopic[]; questions?: HelpQuestion[] }): React.JSX.Element`, `features/help/components/HelpCenter.tsx`: Client Component; héroe con `<h1>` y buscador, temas, preguntas en `<details>` y estado vacío.
- `HELP_TOPICS: HelpTopic[]` y `HELP_QUESTIONS: HelpQuestion[]`, `features/help/lib/content.ts`: los datos.
- `filterQuestions(questions: HelpQuestion[], query: string): HelpQuestion[]`, `features/help/lib/filter.ts`.
- `HelpTopic = { id: string; title: string; summary: string; icon: HelpTopicIcon }`, `HelpQuestion = { id: string; topic: string; question: string; answer: string; source: string }` y `HelpTopicIcon = "how" | "payments" | "pickup" | "account" | "recipes"`, `features/help/lib/content.ts`.

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Datos | `lib/content.ts` | temas, preguntas, respuestas y su fuente |
| Filtro | `lib/filter.ts` | normaliza (sin acentos ni mayúsculas) y exige todos los términos |
| Centro de ayuda | `components/HelpCenter.tsx` | estado del texto, héroe, temas, preguntas y vacío |

## 6. Dependencias

- `components/EmptyState.tsx`, `components/ui/card.tsx`, `components/ui/input.tsx`.
- `lucide-react` para los íconos de los temas.

## 7. Ejemplo de uso

```tsx
import { HelpCenter } from "@/features/help/components/HelpCenter";

export default function Page() {
  return <HelpCenter />;
}
```

## 8. Restricciones

- Sin llamadas a la API ni al navegador hacia posveapi: el contenido es estático.
- Sin montos en las respuestas; los plazos y reglas salen de la spec citada.
- Las preguntas plegables usan `<details>`; el filtro abre todas las coincidencias y, sin texto, sólo la primera.
- El enlace de cada tema apunta a `#pregunta-<id>` de su primera pregunta; un tema sin preguntas no tiene enlace (`content.test.ts`, "todo tema tiene al menos una pregunta").

## 9. Pruebas

- Comando: `npx --prefix <repo> vitest run --root <repo> features/help`
- `features/help/__tests__/content.test.ts`: cita de fuente, tema existente, temas con pregunta e ids únicos.
- `features/help/__tests__/filter.test.ts`: acentos, mayúsculas y términos múltiples.
- `features/help/__tests__/HelpCenter.test.tsx`: lista completa, filtro y "Sin coincidencias".

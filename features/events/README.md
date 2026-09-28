---
module: "events"
path: "features/events"
type: "feature"
exports: ["EVENT_DEDUP_WINDOW_MS", "isBot", "createDeduper", "handleEvent", "sendBeaconEvent", "ContactButtons", "ViewBeacon", "POST /api/events"]
depends_on: ["lib/marketplace/client.ts", "lib/marketplace/schemas.ts", "lib/site.ts", "components/ui/button.tsx"]
tests: "features/events/*.test.{ts,tsx}"
verified_against: ["features/events/handle.ts", "features/events/beacon.ts", "features/events/ContactButtons.tsx", "features/events/ViewBeacon.tsx", "app/api/events/route.ts", "lib/marketplace/client.ts", "lib/marketplace/schemas.ts", "lib/site.ts", "components/ui/button.tsx"]
capabilities:
  - intent: "registrar una vista o un clic de contacto de quien busca"
    intent_aliases: ["registrar evento", "contar visitas", "analitica de tienda", "clics de whatsapp", "vistas de producto"]
    entrypoint: "POST /api/events"
    file: "app/api/events/route.ts"
    input: "cuerpo JSON { type: 'product_view' | 'store_view' | 'click_whatsapp' | 'click_call' | 'click_route', store_slug: string | null, product_slug: string | null }; product_view exige product_slug y store_slug null, los demás exigen store_slug; cookie sid opcional"
    output: "202 o 400 sin cuerpo; fija la cookie sid (UUID, httpOnly, sameSite lax, de sesión) si falta o no es UUID"
    source: "navegador vía sendBeaconEvent(); reenvía { ...evento, session_id } a sendEvent() de lib/marketplace"
    rules: ["RN-EVENTS-01", "RN-EVENTS-02"]
  - intent: "mostrar los botones de contacto de una tienda"
    intent_aliases: ["boton de whatsapp", "llamar a la tienda", "ver ruta", "como llegar", "contactar tienda"]
    entrypoint: "<ContactButtons />"
    file: "features/events/ContactButtons.tsx"
    input: "store: StoreSummary; product: { slug: string; name: string; restriction: Restriction } | null"
    output: "enlaces WhatsApp (wa.me con mensaje), Llamar (tel:) y Ver ruta (Google Maps), cada uno con su evento click_* al hacer clic"
    source: "props"
    rules: ["RN-EVENTS-03"]
  - intent: "registrar la vista de una página de producto o de tienda"
    intent_aliases: ["vista de pagina", "product_view", "store_view", "beacon de vista"]
    entrypoint: "<ViewBeacon />"
    file: "features/events/ViewBeacon.tsx"
    input: "event: EventInput"
    output: "nada visible; manda el evento una vez al montar"
    source: "props"
    rules: []
---

# Módulo `events`

## 1. Propósito

Registra las vistas de producto y tienda y los clics de contacto (WhatsApp, llamada, ruta) que
después ve el comercio en su backoffice, y pinta esos botones de contacto. El navegador manda el
evento a `/api/events`; el servidor descarta bots, deduplica y lo reenvía a posveapi. No muestra
estadísticas ni guarda nada propio.

## 2. Reglas de negocio

| Regla | Enunciado | Test que la hace cumplir |
|---|---|---|
| `RN-EVENTS-01` | Un evento sin user-agent o con uno de bot (`bot`, `crawl`, `spider`, `slurp`, `facebookexternalhit`, `headless`, `lighthouse`, `preview`) responde 202 y no se reenvía. | `features/events/handle.test.ts` ("un bot (Googlebot) y un user-agent nulo responden 202 sin reenvío") |
| `RN-EVENTS-02` | Un evento con la misma sesión, tipo, tienda y producto que otro reenviado hace menos de 10 minutos responde 202 y no se reenvía; un duplicado no renueva la ventana. | `features/events/handle.test.ts` ("el mismo evento dentro de 10 minutos no se reenvía y pasados 10 minutos sí") |
| `RN-EVENTS-03` | El botón de WhatsApp no se pinta si la tienda no tiene `whatsapp` o si el producto es `recipe`; "Llamar" no se pinta si la tienda no tiene `phone`. | `features/events/ContactButtons.test.tsx` ("sin whatsapp no pinta WhatsApp", "con un producto recipe no pinta WhatsApp", "sin phone no pinta Llamar") |

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Qué user-agent cuenta como bot | `BOT_USER_AGENT` en `handle.ts` | el caso de RN-EVENTS-01 en `handle.test.ts` |
| Ventana de deduplicación o clave | `EVENT_DEDUP_WINDOW_MS` y la `key` de `handleEvent` en `handle.ts` | el caso de RN-EVENTS-02 en `handle.test.ts` |
| Cookie de sesión | `readSessionId` en `app/api/events/route.ts` | nada: el valor tiene que seguir siendo UUID, lo exige `marketplaceEventSchema` |
| Un botón de contacto, su texto o su enlace | `ContactButtons.tsx` | `ContactButtons.test.tsx`; el tipo de evento sale de `EventType` en `lib/marketplace/schemas.ts` |
| Un tipo de evento nuevo | spec §3.4 y `eventTypeSchema` en `lib/marketplace/schemas.ts` | quien lo manda (`ContactButtons` o un `ViewBeacon` montado en su página) |

## 4. API pública

- `EVENT_DEDUP_WINDOW_MS = 600_000`, `features/events/handle.ts`
- `isBot(userAgent: string | null): boolean`, `features/events/handle.ts`
- `createDeduper(windowMs = EVENT_DEDUP_WINDOW_MS): (key: string, now: number) => boolean`, `features/events/handle.ts`
- `handleEvent(p: { body: string; userAgent: string | null; sessionId: string; now: number; shouldForward: (key: string, now: number) => boolean }): { status: 202 | 400; forward: MarketplaceEvent | null }`, `features/events/handle.ts`
- `sendBeaconEvent(input: EventInput): void`, del navegador, `features/events/beacon.ts`
- `ContactButtons({ store, product }: { store: StoreSummary; product: { slug: string; name: string; restriction: Restriction } | null })`, Client Component, `features/events/ContactButtons.tsx`
- `ViewBeacon({ event }: { event: EventInput })`, Client Component que no pinta nada, `features/events/ViewBeacon.tsx`
- `POST /api/events`, route handler, `app/api/events/route.ts`

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| `handleEvent` | `features/events/handle.ts` | cuerpo que no es JSON o no pasa `eventInputSchema`: 400; bot o duplicado: 202 sin reenvío; si no, 202 con `session_id` |
| `createDeduper` | `features/events/handle.ts` | `Map` de clave a hora del último reenvío; con más de 10 000 claves borra las vencidas |
| Deduplicador de módulo | `app/api/events/route.ts` | una instancia por proceso de Node, compartida por todas las peticiones |
| `readSessionId` | `app/api/events/route.ts` | lee la cookie `sid`; si falta o no es UUID fija `crypto.randomUUID()` |
| Reenvío | `app/api/events/route.ts` | `after(() => sendEvent(forward))`; un error se registra con `console.error("[events]", error)` |
| `sendBeaconEvent` | `features/events/beacon.ts` | `navigator.sendBeacon` con un `Blob` `text/plain;charset=UTF-8`; si no existe o devuelve `false`, `fetch` con `keepalive` |
| `whatsappHref` | `features/events/ContactButtons.tsx` | `https://wa.me/{dígitos}?text=` con el mensaje que nombra el producto o, sin producto, la tienda |

## 6. Dependencias

- `lib/marketplace/client.ts`: `sendEvent()` en `app/api/events/route.ts`.
- `lib/marketplace/schemas.ts`: `eventInputSchema` y los tipos `EventInput`, `MarketplaceEvent`, `EventType`, `StoreSummary`, `Restriction`.
- `lib/site.ts` (`SITE_NAME`) y `components/ui/button.tsx` (`buttonClasses`).
- `next/headers` (`cookies`), `next/server` (`after`) y `zod` (`z.uuid()`) en `app/api/events/route.ts`.

## 7. Ejemplo de uso

```tsx
import { ContactButtons } from "@/features/events/ContactButtons";
import { ViewBeacon } from "@/features/events/ViewBeacon";
import type { StoreSummary } from "@/lib/marketplace/schemas";

export function StoreContact({ store }: { store: StoreSummary }) {
  return (
    <>
      <ViewBeacon event={{ type: "store_view", store_slug: store.slug, product_slug: null }} />
      <ContactButtons store={store} product={null} />
    </>
  );
}
```

## 8. Restricciones

- El navegador nunca llama a posveapi: los eventos pasan por `/api/events` y sólo el servidor llama a `sendEvent()`.
- Falla silenciosa: `sendBeaconEvent` nunca lanza y los enlaces de contacto no llaman a `preventDefault`, así que se abren aunque el registro falle (spec §6).
- Un error al reenviar no cambia la respuesta: `after` corre después de responder.
- `product_view` lleva `store_slug` nulo porque una página de producto muestra varias tiendas (spec §3.4).
- Un producto `recipe` se muestra sin WhatsApp y con "Llamar" y "Ver ruta" (spec §3.1, ítem 5); "Ver ruta" abre sólo Google Maps.
- La deduplicación vive en la memoria del proceso: con varias instancias del servidor, cada una deduplica por su cuenta.

## 9. Pruebas

- Comando: `npx vitest run features/events`
- `features/events/handle.test.ts`: cuerpo inválido 400, `product_view` válido con `session_id`, bot y user-agent nulo sin reenvío, duplicado dentro y fuera de la ventana.
- `features/events/ContactButtons.test.tsx`: los tres `href`, sin WhatsApp por falta de número o por `recipe`, sin "Llamar" sin teléfono, clic en "Ver ruta" manda `click_route`.

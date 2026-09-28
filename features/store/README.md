---
module: "store"
path: "features/store"
type: "feature"
exports: ["StoreCard", "NearbyStores", "NearbyStoresSkeleton"]
depends_on: ["lib/marketplace/client.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "lib/site.ts", "features/location/cookie.ts", "features/location/server.ts", "components/ui/badge.tsx", "components/ui/cx.ts", "components/ui/skeleton.tsx"]
tests: "features/store/*.test.{ts,tsx}"
verified_against: ["features/store/StoreCard.tsx", "features/store/NearbyStores.tsx", "app/page.tsx", "lib/marketplace/client.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/format.ts", "lib/site.ts", "features/location/cookie.ts", "features/location/server.ts", "components/ui/badge.tsx", "components/ui/cx.ts", "components/ui/skeleton.tsx"]
capabilities:
  - intent: "mostrar las tiendas cercanas en la portada"
    intent_aliases: ["tiendas cercanas", "tiendas cerca de mi", "comercios cercanos", "tiendas destacadas"]
    entrypoint: "<NearbyStores />"
    file: "features/store/NearbyStores.tsx"
    input: "sin props; lee la cookie loc; se monta dentro de <Suspense fallback={<NearbyStoresSkeleton />}>"
    output: "sección 'Tiendas cercanas' (con ubicación) o 'Tiendas en {SITE_NAME}' (sin ella): destacados primero y un StoreCard por tienda; sin tiendas, un aviso que invita a probar otra ciudad"
    source: "listNearbyStores() de lib/marketplace con geo de la cookie loc"
    rules: ["RN-STORE-02"]
  - intent: "mostrar la tarjeta de una tienda"
    intent_aliases: ["tarjeta de tienda", "logo de tienda", "iniciales de tienda"]
    entrypoint: "<StoreCard />"
    file: "features/store/StoreCard.tsx"
    input: "store: NearbyStore; featured?: boolean"
    output: "enlace a /tienda/{slug} con logo o iniciales, nombre, city.name, distancia si no es null y 'Destacado' si featured"
    source: "props"
    rules: ["RN-STORE-01"]
---

# Módulo `store`

## 1. Propósito

Las tiendas en la portada: la lista "Tiendas cercanas" según la ubicación de la cookie `loc` y la
tarjeta de cada tienda. No ordena ni calcula distancias (la API entrega el orden y `distance_km`)
ni pinta la página de una tienda.

## 2. Reglas de negocio

| Regla | Enunciado | Test que la hace cumplir |
|---|---|---|
| `RN-STORE-01` | El logo se muestra sólo si la tienda es premium y tiene `logo_url`; si no, un círculo con la inicial en mayúscula de cada una de las dos primeras palabras del nombre. | `features/store/StoreCard.test.tsx` ("toma las iniciales de las dos primeras palabras del nombre", "premium sin logo muestra las iniciales", "no premium con logo_url muestra las iniciales y no el logo") |
| `RN-STORE-02` | Los destacados (hasta dos, con "Destacado") van primero y una tienda destacada que también viene en `data` no se repite. | `features/store/NearbyStores.test.tsx` ("un destacado que también viene en data aparece una sola vez y primero") |

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Datos o aspecto de la tarjeta | `StoreCard.tsx` | `StoreCard.test.tsx`; la distancia sólo por `formatDistance` |
| Cuándo se muestra el logo o cómo salen las iniciales | `logoUrl` e `initials` en `StoreCard.tsx` | los casos de RN-STORE-01 en `StoreCard.test.tsx` |
| Qué se pide a la API o cuántos destacados | la llamada a `listNearbyStores` y `MAX_FEATURED_STORES` en `NearbyStores.tsx` | `NearbyStores.test.tsx`; las claves de la consulta las fija `storesQuery` de `lib/marketplace/params.ts` |
| Títulos o aviso sin tiendas | `NearbyStores.tsx` | el `getByRole("heading")` de `e2e/search.spec.ts` |

## 4. API pública

- `StoreCard({ store, featured }: { store: NearbyStore; featured?: boolean })`, `features/store/StoreCard.tsx`
- `NearbyStores(): Promise<React.JSX.Element>`, Server Component sin props, `features/store/NearbyStores.tsx`
- `NearbyStoresSkeleton()`, fallback de `NearbyStores`, `features/store/NearbyStores.tsx`

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| `initials` | `features/store/StoreCard.tsx` | primeras letras de las dos primeras palabras del nombre, en mayúscula |
| Ubicación efectiva | `features/store/NearbyStores.tsx` | una ciudad que `describeLocation` no reconoce cuenta como sin ubicación: `geo` null y sin radio |
| Consulta | `features/store/NearbyStores.tsx` | `listNearbyStores({ geo, radiusKm: geo ? DEFAULT_RADIUS_KM : null, page: 1 })` |
| Orden de pintado | `features/store/NearbyStores.tsx` | `featured` (hasta `MAX_FEATURED_STORES`, 2) y después `data` sin los slugs destacados |

## 6. Dependencias

- `lib/marketplace/client.ts`: `listNearbyStores()` y `listLocations()` en `NearbyStores.tsx`.
- `lib/marketplace/params.ts` (`DEFAULT_RADIUS_KM`) y `lib/marketplace/schemas.ts` (`NearbyStore`).
- `features/location/server.ts` (`getUserLocation`) y `features/location/cookie.ts` (`toGeoFilter`, `describeLocation`).
- `lib/format.ts` (`formatDistance`) y `lib/site.ts` (`SITE_NAME`).
- `components/ui/badge.tsx`, `components/ui/cx.ts` y `components/ui/skeleton.tsx`.
- `next/link` y `next/image`.

## 7. Ejemplo de uso

```tsx
import { Suspense } from "react";
import { NearbyStores, NearbyStoresSkeleton } from "@/features/store/NearbyStores";

export default function Home() {
  return (
    <Suspense fallback={<NearbyStoresSkeleton />}>
      <NearbyStores />
    </Suspense>
  );
}
```

## 8. Restricciones

- `NearbyStores` lee la cookie `loc`: va siempre dentro de un `<Suspense>` (`cacheComponents: true`) y nunca dentro de `'use cache'`.
- El orden de las tiendas y `distance_km` los entrega la API; aquí sólo se quitan los destacados repetidos y se formatea la distancia.
- Logo sólo para premium porque es parte de lo que la tienda premium recibe (spec §5.4); `logo_url` de una tienda sin premium se ignora.
- El logo va por `next/image`: su dominio tiene que estar en `images.remotePatterns` de `next.config.ts` (spec §4.5).

## 9. Pruebas

- Comando: `npx vitest run features/store`
- `features/store/StoreCard.test.tsx`: iniciales "FS", premium sin logo y no premium con `logo_url` muestran iniciales, y "Destacado" con `featured`.
- `features/store/NearbyStores.test.tsx`: destacado repetido en `data` aparece una vez y primero; ciudad desconocida se pide sin ubicación.
- `e2e/search.spec.ts` (`npx playwright test`): la portada muestra el bloque de tiendas.

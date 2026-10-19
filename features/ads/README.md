---
module: "ads"
path: "features/ads"
type: "feature"
exports: ["getPagePlacements", "pieceForSlot", "AdImpression", "AdLink", "AdBanner", "IMPRESSION_VISIBLE_RATIO", "IMPRESSION_DWELL_MS", "SPONSORED_LABEL"]
depends_on: ["lib/marketplace/client.ts", "lib/marketplace/schemas.ts", "lib/marketplace/params.ts", "lib/marketplace/errors.ts", "features/location/server/location.ts", "features/location/lib/cookie.ts", "features/events/lib/beacon.ts", "next.config.ts"]
tests: "features/ads/__tests__/*.test.{ts,tsx}"
verified_against: ["features/ads/server/placements.ts", "features/ads/components/AdImpression.tsx", "features/ads/components/AdLink.tsx", "features/ads/components/AdBanner.tsx", "lib/marketplace/client.ts", "lib/marketplace/schemas.ts", "features/events/lib/beacon.ts", "features/location/server/location.ts", "next.config.ts"]
verified_at: "1165368"
capabilities:
  - intent: "leer las piezas publicitarias de una página"
    intent_aliases: ["placements", "espacios publicitarios", "anuncios de la pagina", "pieza de un espacio"]
    entrypoint: "getPagePlacements()"
    file: "features/ads/server/placements.ts"
    input: "page: PlacementPage; scope: { category?: string | null; store?: string | null } (opcional)"
    output: "PlacementsResponse | null; null si la API no responde; pieceForSlot(placements, slot) saca la Piece de un espacio o null"
    source: "GET /placements vía getPlacements() de lib/marketplace"
    rules: ["RN-ADS-01"]
  - intent: "pintar un banner publicitario con su conteo de impresión y clic"
    intent_aliases: ["banner patrocinado", "anuncio banner", "pieza publicitaria", "marca patrocinado"]
    entrypoint: "<AdBanner />"
    file: "features/ads/components/AdBanner.tsx"
    input: "piece: Piece | null; className?: string"
    output: "imagen de escritorio y de móvil dentro de un enlace, con la marca Patrocinado si kind es ad; nada si no hay pieza ni imagen; manda ad_impression al verse y ad_click al hacer clic"
    source: "props"
    rules: ["RN-ADS-02", "RN-ADS-03", "RN-ADS-04", "RN-ADS-05"]
---

# Módulo `ads`

## 1. Propósito

Lee los espacios publicitarios de una página (`GET /placements`) y pinta la pieza de formato
`banner` con sus dos imágenes, la marca "Patrocinado" y el conteo de impresiones y clics
(`ad_impression`, `ad_click`) por `/api/events`. No decide qué anuncio rota ni cuenta nada en el
servidor: eso lo hace posveapi con el token de la pieza.

## 2. Reglas de negocio

| Regla | Enunciado | Test que la hace cumplir |
|---|---|---|
| `RN-ADS-01` | `getPagePlacements` lee una vez por pedido y combinación de página, categoría y tienda, y devuelve `null` si la API no responde; cualquier otro error se relanza. | `features/ads/__tests__/placements.test.ts` ("llamadas con los mismos argumentos, con o sin el objeto de alcance, comparten una sola lectura", "devuelve null si la API no está y relanza cualquier otro error") |
| `RN-ADS-02` | La impresión se manda cuando al menos la mitad de la pieza lleva un segundo visible, y una sola vez por montaje. | `features/ads/__tests__/AdImpression.test.tsx` ("manda ad_impression tras un segundo con al menos la mitad visible, una sola vez") |
| `RN-ADS-03` | Salir de la vista antes del segundo, o ver menos de la mitad, o desmontar, no cuenta la impresión. | `features/ads/__tests__/AdImpression.test.tsx` ("no cuenta si sale de la vista antes del segundo o si ve menos de la mitad", "al desmontar cancela el temporizador") |
| `RN-ADS-04` | El clic manda `ad_click` con el token de la pieza; un destino externo abre otra pestaña con `rel="sponsored noopener"` y uno interno usa `next/link`. | `features/ads/__tests__/AdBanner.test.tsx` ("el clic en un destino interno manda ad_click sin target", "un destino externo abre otra pestaña con rel sponsored noopener") |
| `RN-ADS-05` | La marca "Patrocinado" sólo sale con `kind: "ad"`; sin pieza o sin ninguna imagen el banner no pinta nada. | `features/ads/__tests__/AdBanner.test.tsx` ("pinta las dos imágenes con alt y la marca Patrocinado sólo en kind ad", "sin pieza o sin imágenes no pinta nada") |

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Umbral o tiempo de la impresión | `IMPRESSION_VISIBLE_RATIO` e `IMPRESSION_DWELL_MS` en `components/AdImpression.tsx` | el caso de RN-ADS-02 en `__tests__/AdImpression.test.tsx` |
| Medidas, imágenes o marca del banner | `components/AdBanner.tsx` (relación 2:1 en móvil y 5:1 desde `sm`, spec §2.2) | `__tests__/AdBanner.test.tsx` |
| Atributos del enlace o del clic | `components/AdLink.tsx` | el caso de RN-ADS-04 en `__tests__/AdBanner.test.tsx` |
| Qué se pide a la API o cómo se agrupa la lectura | `loadPlacements` y `getPagePlacements` en `server/placements.ts` | el caso de RN-ADS-01 en `__tests__/placements.test.ts` |
| Un formato de pieza nuevo | un componente en `components/` que envuelva `AdImpression` y `AdLink` | exports y sección 4 |

## 4. API pública

- `getPagePlacements(page: PlacementPage, scope?: { category?: string | null; store?: string | null }): Promise<PlacementsResponse | null>`, `features/ads/server/placements.ts`
- `pieceForSlot(placements: PlacementsResponse | null, slot: string): Piece | null`, `features/ads/server/placements.ts`
- `AdImpression({ token, children, className }: { token: string; children: ReactNode; className?: string })`, Client Component, `features/ads/components/AdImpression.tsx`
- `AdLink({ piece, children, className }: { piece: Pick<Piece, "href" | "external" | "token">; children: ReactNode; className?: string })`, Client Component, `features/ads/components/AdLink.tsx`
- `AdBanner({ piece, className }: { piece: Piece | null; className?: string })`, `features/ads/components/AdBanner.tsx`
- `IMPRESSION_VISIBLE_RATIO = 0.5`, `features/ads/components/AdImpression.tsx`
- `IMPRESSION_DWELL_MS = 1000`, `features/ads/components/AdImpression.tsx`
- `SPONSORED_LABEL = "Patrocinado"`, `features/ads/components/AdBanner.tsx`

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| `loadPlacements` | `features/ads/server/placements.ts` | `cache` de React por `(page, category, store)` con `null` en lugar de ausente; resuelve la ubicación con `getEffectiveLocation` y `toGeoFilter`, y el radio con `DEFAULT_RADIUS_KM` si hay ubicación |
| `AdImpression` | `features/ads/components/AdImpression.tsx` | `IntersectionObserver` con umbral 0,5 y temporizador de 1 s que se cancela al salir; al disparar se desconecta |
| `AdLink` | `features/ads/components/AdLink.tsx` | `<a target="_blank" rel="sponsored noopener">` si `external`, `Link` si no; `onClick` manda `ad_click` |
| `AdBanner` | `features/ads/components/AdBanner.tsx` | dos `next/image` (móvil `sm:hidden`, escritorio `hidden sm:block`); si falta una imagen usa la otra |

## 6. Dependencias

- `lib/marketplace/client.ts`: `getPlacements()` en `server/placements.ts`.
- `lib/marketplace/schemas.ts` (`Piece`, `PlacementsResponse`, `PlacementPage`), `lib/marketplace/params.ts` (`DEFAULT_RADIUS_KM`) y `lib/marketplace/errors.ts` (`MarketplaceUnavailableError`).
- `features/location/server/location.ts` (`getEffectiveLocation`) y `features/location/lib/cookie.ts` (`toGeoFilter`).
- `features/events/lib/beacon.ts`: `sendBeaconEvent()` en `AdImpression` y `AdLink`.
- `next.config.ts`: `images.remotePatterns` autoriza `media.posven.io`, el host que posveapi usa para las imágenes de producto (Spatie `getUrl()`, el mismo origen que las de las piezas).
- `next/image` y `next/link`.

## 7. Ejemplo de uso

```tsx
import { AdBanner } from "@/features/ads/components/AdBanner";
import { getPagePlacements, pieceForSlot } from "@/features/ads/server/placements";

export async function StoresTopBanner() {
  const placements = await getPagePlacements("stores");
  return <AdBanner piece={pieceForSlot(placements, "stores_top")} />;
}
```

## 8. Restricciones

- Los espacios no se cachean y, si la API falla o no hay pieza, no se pinta nada: la página no cae (excepción de `.claude/rules/app-router.md` ítem 7, como `NearbyProducts`).
- `getPagePlacements` lee la cookie de ubicación: el componente que lo llama va dentro de `<Suspense>`.
- `getPagePlacements` pasa `category` y `store` a `loadPlacements` como `string | null`: `cache` indexa por la lista de argumentos y `undefined` y `null` serían claves distintas.
- El navegador nunca llama a posveapi: el clic y la impresión pasan por `sendBeaconEvent` hacia `/api/events`.
- El clic manda `ad_click` antes de navegar, sin `preventDefault`; si el registro falla el enlace se abre igual.
- Las piezas `kind: "house"` cuentan impresiones y clics, pero no llevan la marca "Patrocinado".
- El host de las imágenes se deduce de que posveapi las sirve con el mismo disco de Spatie que las de producto; el `.env` no se lee, así que si el disco apuntara a otro host, `next/image` lo rechazaría y habría que agregarlo a `remotePatterns`.

## 9. Pruebas

- Comando: `npx vitest run features/ads`
- `features/ads/__tests__/placements.test.ts`: argumentos enviados a `getPlacements`, una lectura por combinación (con `cache` simulado que memoiza por argumentos), `null` con la API caída y relanzado del resto, `pieceForSlot`.
- `features/ads/__tests__/AdImpression.test.tsx`: un `IntersectionObserver` simulado y temporizadores falsos para umbral 0,5, un segundo, una sola vez y cancelación al salir o desmontar.
- `features/ads/__tests__/AdBanner.test.tsx`: sin pieza ni imágenes no pinta, marca sólo en `ad`, clic interno y externo con su `rel` y `ad_click`.

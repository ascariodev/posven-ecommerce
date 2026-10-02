---
module: "location"
path: "features/location"
type: "feature"
exports: ["LOCATION_COOKIE", "UserLocation", "isValidCoords", "parseLocationCookie", "serializeLocation", "toGeoFilter", "describeLocation", "getUserLocation", "getEffectiveLocation", "setLocationFromCoords", "setLocationCity", "loadLocationStates", "clearLocation", "LocationPicker", "LocationSheet", "LocationBar", "LocationBarSkeleton"]
depends_on: ["lib/marketplace/client.ts", "lib/marketplace/errors.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "components/ui/button.tsx", "components/ui/select.tsx", "components/ui/sheet.tsx", "components/ui/skeleton.tsx"]
tests: "features/location/__tests__/*.test.{ts,tsx}"
verified_against: ["features/location/lib/cookie.ts", "features/location/server/location.ts", "features/location/server/actions.ts", "features/location/components/LocationPicker.tsx", "features/location/components/LocationBar.tsx", "features/location/components/LocationSheet.tsx", "features/location/__tests__/server.test.ts", "features/location/__tests__/LocationBar.test.tsx", "features/search/components/SearchPill.tsx", "app/layout.tsx", "lib/marketplace/client.ts", "lib/marketplace/errors.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "components/ui/button.tsx", "components/ui/skeleton.tsx"]
capabilities:
  - intent: "leer la ubicación efectiva del usuario para filtrar por cercanía"
    intent_aliases: ["ubicacion del usuario", "ubicacion efectiva", "cookie de ubicacion", "donde esta el usuario", "filtro geo"]
    entrypoint: "getEffectiveLocation()"
    file: "features/location/server/location.ts"
    input: "sin parámetros; lee la cookie loc de la petición y listLocations()"
    output: "{ location: UserLocation | null; name: string | null }; ciudad desconocida o sin cookie, { location: null, name: null }; toGeoFilter(location) la traduce a GeoFilter"
    source: "cookie loc y listLocations()"
    rules: ["RN-LOCATION-01", "RN-LOCATION-02", "RN-LOCATION-04"]
  - intent: "guardar la ubicación del usuario por geolocalización o ciudad elegida"
    intent_aliases: ["usar mi ubicacion", "elegir ciudad", "cambiar ubicacion", "quitar ubicacion"]
    entrypoint: "setLocationFromCoords() / setLocationCity() / clearLocation()"
    file: "features/location/server/actions.ts"
    input: "(lat: number, lng: number) | (citySlug: string) | sin parámetros"
    output: "{ ok: boolean } (clearLocation: void); escribe o borra la cookie loc"
    source: "cookie loc; listLocations() de lib/marketplace para validar la ciudad"
    rules: ["RN-LOCATION-01", "RN-LOCATION-03"]
  - intent: "mostrar y cambiar la ubicación en pantalla"
    intent_aliases: ["barra de ubicacion", "selector de ubicacion", "cerca de"]
    entrypoint: "<LocationBar />"
    file: "features/location/components/LocationBar.tsx"
    input: "compact?: boolean; degrade?: boolean (por defecto false; true en la cabecera); se monta dentro de <Suspense fallback={<LocationBarSkeleton />}> (lo hace SearchPill)"
    output: "separador de la píldora y LocationSheet: botón con la ciudad (o '¿Dónde?') que abre un Sheet 'Tu ubicación' con LocationPicker y su selector Estado/Municipio/Ciudad; acepta compact; con degrade y la API caída no pinta nada"
    source: "cookie loc y listLocations()"
    rules: ["RN-LOCATION-02", "RN-LOCATION-03"]
---

# Módulo `location`

## 1. Propósito

Ubicación de quien busca: coordenadas del navegador o una ciudad elegida, guardadas en la cookie
`loc` para que el servidor filtre por cercanía. No calcula distancias ni habla con posveapi salvo
para validar la ciudad con `listLocations()`; sin ubicación la búsqueda es nacional.

## 2. Reglas de negocio

| Regla | Enunciado | Test que la hace cumplir |
|---|---|---|
| `RN-LOCATION-01` | Las coordenadas se guardan en la cookie redondeadas a 3 decimales. | `features/location/__tests__/cookie.test.ts` ("redondea las coordenadas a 3 decimales") |
| `RN-LOCATION-02` | Una cookie ilegible, o con lat fuera de [-90, 90] o lng fuera de [-180, 180], equivale a no tener ubicación. | `features/location/__tests__/cookie.test.ts` ("devuelve null ante texto basura", "devuelve null con lat fuera de [-90, 90]") |
| `RN-LOCATION-03` | Sólo se guarda una ciudad que `listLocations()` devuelve; una desconocida responde `{ ok: false }` sin tocar la cookie. | `features/location/__tests__/actions.test.ts` ("rechaza una ciudad desconocida sin tocar la cookie") |
| `RN-LOCATION-04` | Una ciudad de la cookie que `describeLocation` no reconoce cuenta como sin ubicación: `getEffectiveLocation` devuelve `{ location: null, name: null }`. | `features/location/__tests__/server.test.ts` ("una ciudad desconocida cuenta como sin ubicación") |

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Forma o validación del valor de la cookie | `parseLocationCookie` y `serializeLocation` en `lib/cookie.ts` | sus casos en `__tests__/cookie.test.ts`; una cookie vieja que deje de leerse vale como sin ubicación (RN-LOCATION-02) |
| Opciones de la cookie (duración, `secure`) | `saveLocation` en `server/actions.ts` | el `toHaveBeenCalledWith` de `__tests__/actions.test.ts` |
| Textos o pasos del selector | `components/LocationPicker.tsx` | los nombres accesibles que busca `__tests__/LocationPicker.test.tsx` y `e2e/search.spec.ts` |
| El botón o la hoja de ubicación | `components/LocationSheet.tsx` | su nombre accesible ("Ubicación: {label}" o "¿Dónde? Ubicación: sin elegir", que contiene el texto visible, WCAG 2.5.3) lo busca `e2e/search.spec.ts` |
| Cómo llega la ubicación a la consulta | `toGeoFilter` en `lib/cookie.ts` | `GeoFilter` vive en `lib/marketplace/params.ts` y no se cambia desde acá |
| Qué ubicación cuenta como efectiva | `getEffectiveLocation` en `server/location.ts` | sus casos en `__tests__/server.test.ts`; la consume `components/LocationBar.tsx` (`LocationBar`), `features/search/components/SearchResults.tsx`, `features/store/components/NearbyStores.tsx` y `features/product/components/ProductOffers.tsx` |

## 4. API pública

Valor de la cookie, `features/location/lib/cookie.ts` (sin dependencias de servidor):

- `LOCATION_COOKIE = "loc"`
- `type UserLocation = { kind: "coords"; lat: number; lng: number } | { kind: "city"; city: string }`
- `isValidCoords(lat: number, lng: number): boolean`
- `parseLocationCookie(raw: string | undefined): UserLocation | null`
- `serializeLocation(loc: UserLocation): string`
- `toGeoFilter(loc: UserLocation | null): GeoFilter`
- `describeLocation(loc: UserLocation | null, states: LocationState[]): string | null`: coordenadas, "Tu ubicación actual"; ciudad, su `name`; ciudad desconocida o `null`, `null`.

Lectura, `features/location/server/location.ts` (`import "server-only"`):

- `getUserLocation(): Promise<UserLocation | null>`: la cookie tal cual, sin validar la ciudad.
- `getEffectiveLocation(): Promise<{ location: UserLocation | null; name: string | null }>`: la cookie y `listLocations()`; `name` es el de `describeLocation` y, si es `null`, `location` también (RN-LOCATION-04).

Acciones de servidor, `features/location/server/actions.ts` (`"use server"`):

- `setLocationFromCoords(lat: number, lng: number): Promise<{ ok: boolean }>`
- `setLocationCity(citySlug: string): Promise<{ ok: boolean }>`
- `loadLocationStates(): Promise<LocationState[] | null>`, `server/actions.ts`: el árbol Estado/Municipio/Ciudad desde `listLocations()` (cacheado); `null` si la API no responde
- `clearLocation(): Promise<void>`

Componentes:

- `LocationPicker({ label, states, statesFailed, onDone }: { label: string | null; states: LocationState[] | null; statesFailed?: boolean; onDone?: () => void })`, `features/location/components/LocationPicker.tsx` (`"use client"`): `states` `null` es "aún no llega": "Elegir ciudad" queda deshabilitado con "Cargando ciudades..." y, con `statesFailed`, con un aviso de error. `onDone` se llama tras guardar la ciudad, usar la ubicación con éxito o quitarla
- `LocationSheet({ label, compact }: { label: string | null; compact?: boolean })`, `features/location/components/LocationSheet.tsx` (`"use client"`): `Sheet` controlado que pide el árbol con `loadLocationStates()` la primera vez que se abre (reintenta al reabrir si falló), `side="bottom"` en móvil y `"right"` desde `sm`; disparador `Button variant="ghost"` con `MapPin` y `label ?? "¿Dónde?"`; contenido "Tu ubicación", "Buscamos tiendas cerca de este lugar." y `LocationPicker` con `onDone` que lo cierra
- `LocationBar({ compact, degrade }: { compact?: boolean; degrade?: boolean }): Promise<React.JSX.Element | null>`, Server Component, y `LocationBarSkeleton({ compact }: { compact?: boolean })` (`h-11 w-28 rounded-full`, `h-11 md:h-9` con `compact`), `features/location/components/LocationBar.tsx`: `LocationBar` ya no lee `listLocations()` ni pasa `states`: el árbol no viaja en el payload de la página. Es el segmento "dónde" de `SearchPill`; pinta el separador vertical de la píldora y `LocationSheet` (el esqueleto también lleva el separador). Con `degrade` (la cabecera), si `getEffectiveLocation()` lanza `MarketplaceUnavailableError` devuelve `null`; sin `degrade`, el error sube a `app/error.tsx`

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| `saveLocation` | `features/location/server/actions.ts` | escribe `loc` con `httpOnly`, `sameSite: "lax"`, `path: "/"`, `maxAge` de 30 días y `secure` en producción |
| Selector en cascada | `features/location/components/LocationPicker.tsx` | tres `Select` de `components/ui/select.tsx` (Estado, Municipio, Ciudad), cada etiqueta asociada por `id`; cambiar uno vacía los de abajo |
| Hoja de ubicación | `features/location/components/LocationSheet.tsx` | `useSyncExternalStore` sobre `(min-width: 40rem)` elige el lado del `Sheet`; sin JavaScript de medios (servidor) parte en `bottom` |
| Geolocalización | `requestCurrentPosition` en `features/location/components/LocationPicker.tsx` | `getCurrentPosition` con `timeout: 10000` y `maximumAge: 600000`; si falla, aviso y selector |

## 6. Dependencias

- `lib/marketplace/client.ts`: `listLocations()` en `server/actions.ts` y `server/location.ts`.
- `lib/marketplace/errors.ts`: `MarketplaceUnavailableError`, que `LocationBar` atrapa con `degrade`.
- `lib/marketplace/params.ts` (`GeoFilter`) y `lib/marketplace/schemas.ts` (`LocationState`), sólo tipos.
- `next/headers` (`cookies`) y `next/navigation` (`useRouter`).
- `components/ui/button.tsx`, `components/ui/select.tsx`, `components/ui/sheet.tsx` y `components/ui/skeleton.tsx`.
- `lib/utils.ts` (`cn`) en `LocationSheet` y `LocationBar`.
- `lucide-react` (`MapPin` en `LocationSheet`).

## 7. Ejemplo de uso

```tsx
import { Suspense } from "react";
import { LocationBar, LocationBarSkeleton } from "@/features/location/components/LocationBar";
import { getEffectiveLocation } from "@/features/location/server/location";
import { toGeoFilter } from "@/features/location/lib/cookie";

async function Results() {
  const { location } = await getEffectiveLocation();
  const geo = toGeoFilter(location);
  // geo va a searchProducts({ geo, ... }) de lib/marketplace/client.ts
  return null;
}

// LocationBar pinta el separador de la píldora: fuera de SearchPill, lo normal es montar la píldora.
export default function Page() {
  return (
    <>
      <Suspense fallback={<LocationBarSkeleton />}>
        <LocationBar />
      </Suspense>
      <Suspense>
        <Results />
      </Suspense>
    </>
  );
}
```

## 8. Restricciones

- `LocationBar`, `getUserLocation` y `getEffectiveLocation` leen `cookies()`: quien los usa los envuelve en `<Suspense>` (`cacheComponents: true`) y nunca dentro de `'use cache'`.
- `LocationBar` con `degrade` atrapa sólo `MarketplaceUnavailableError` y relanza lo demás: la cabecera del layout raíz queda fuera de `app/error.tsx` (L-02), y con la API caída tiraría toda la página en vez de dejar que la ruta muestre su reintento. Sin `degrade` (inicio y `/buscar`) no atrapa nada.
- `LocationPicker` no importa `server/location.ts` ni `lib/marketplace/client.ts`: recibe `states` (o `null` mientras llega) y `label` por props y escribe la cookie sólo con las acciones de `server/actions.ts`.
- La cookie es `httpOnly`: el navegador no la lee; tras cada acción el selector llama a `router.refresh()` para que el servidor repinte con la ubicación nueva.
- Las coordenadas se redondean a 3 decimales (unos 100 m) porque el orden por cercanía no necesita más y la cookie no guarda la posición exacta.
- `LocationSheet` es cliente, recibe `label` de `LocationBar` y trae `states` por `loadLocationStates` (acción pública: devuelve `null` si la API no responde); nunca importa `server/location.ts`. El `Select` se abre en un portal: en pruebas se abre el `combobox` por su etiqueta y se elige el `option`.
- Ubicación denegada o fallida no bloquea nada: se ofrece el selector de ciudad (spec §6).

## 9. Pruebas

- Comando: `npx vitest run features/location`
- `features/location/__tests__/cookie.test.ts`: lectura de coordenadas y ciudad, basura, lat fuera de rango, redondeo, `toGeoFilter` y `describeLocation`.
- `features/location/__tests__/server.test.ts`: `getEffectiveLocation` con ciudad desconocida, ciudad conocida y coordenadas.
- `features/location/__tests__/actions.test.ts`: ciudad desconocida sin tocar la cookie y ciudad válida con las opciones exactas.
- `features/location/__tests__/LocationBar.test.tsx`: `LocationBar` con `degrade` y ciudad efectiva (nombre accesible "Ubicación: Valencia", sin pedir el árbol), el árbol pedido sólo al abrir la hoja, con `degrade` y la API caída (no pinta nada) y sin `degrade` con la API caída (el error se propaga); simula `window.matchMedia` con `vi.stubGlobal`, que `LocationSheet` usa.
- `features/location/__tests__/LocationPicker.test.tsx`: botones sin ubicación, "Elegir ciudad" deshabilitado mientras el árbol no llega o falla, aviso y selector ante geolocalización fallida, cascada Estado a Municipio con el `Select` de Radix (jsdom simula `hasPointerCapture`, `releasePointerCapture` y `scrollIntoView` en el propio archivo) y `onDone` tras guardar la ciudad.

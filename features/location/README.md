---
module: "location"
path: "features/location"
type: "feature"
exports: ["LOCATION_COOKIE", "UserLocation", "isValidCoords", "parseLocationCookie", "serializeLocation", "toGeoFilter", "describeLocation", "getUserLocation", "getEffectiveLocation", "setLocationFromCoords", "setLocationCity", "clearLocation", "LocationPicker", "LocationBar", "LocationBarSkeleton", "LocationSummary", "LocationSummarySkeleton"]
depends_on: ["lib/marketplace/client.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "components/ui/button.tsx", "components/ui/skeleton.tsx"]
tests: "features/location/*.test.{ts,tsx}"
verified_against: ["features/location/cookie.ts", "features/location/server.ts", "features/location/actions.ts", "features/location/LocationPicker.tsx", "features/location/LocationBar.tsx", "features/location/server.test.ts", "app/layout.tsx", "lib/marketplace/client.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "components/ui/button.tsx", "components/ui/skeleton.tsx"]
capabilities:
  - intent: "leer la ubicación efectiva del usuario para filtrar por cercanía"
    intent_aliases: ["ubicacion del usuario", "ubicacion efectiva", "cookie de ubicacion", "donde esta el usuario", "filtro geo"]
    entrypoint: "getEffectiveLocation()"
    file: "features/location/server.ts"
    input: "sin parámetros; lee la cookie loc de la petición y listLocations()"
    output: "{ location: UserLocation | null; name: string | null }; ciudad desconocida o sin cookie, { location: null, name: null }; toGeoFilter(location) la traduce a GeoFilter"
    source: "cookie loc y listLocations()"
    rules: ["RN-LOCATION-01", "RN-LOCATION-02", "RN-LOCATION-04"]
  - intent: "guardar la ubicación del usuario por geolocalización o ciudad elegida"
    intent_aliases: ["usar mi ubicacion", "elegir ciudad", "cambiar ubicacion", "quitar ubicacion"]
    entrypoint: "setLocationFromCoords() / setLocationCity() / clearLocation()"
    file: "features/location/actions.ts"
    input: "(lat: number, lng: number) | (citySlug: string) | sin parámetros"
    output: "{ ok: boolean } (clearLocation: void); escribe o borra la cookie loc"
    source: "cookie loc; listLocations() de lib/marketplace para validar la ciudad"
    rules: ["RN-LOCATION-01", "RN-LOCATION-03"]
  - intent: "mostrar y cambiar la ubicación en pantalla"
    intent_aliases: ["barra de ubicacion", "selector de ubicacion", "cerca de"]
    entrypoint: "<LocationBar />"
    file: "features/location/LocationBar.tsx"
    input: "sin props; se monta dentro de <Suspense fallback={<LocationBarSkeleton />}>"
    output: "LocationPicker con label 'Cerca de: {ciudad o Tu ubicación actual}' y selector Estado/Municipio/Ciudad"
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
| `RN-LOCATION-01` | Las coordenadas se guardan en la cookie redondeadas a 3 decimales. | `features/location/cookie.test.ts` ("redondea las coordenadas a 3 decimales") |
| `RN-LOCATION-02` | Una cookie ilegible, o con lat fuera de [-90, 90] o lng fuera de [-180, 180], equivale a no tener ubicación. | `features/location/cookie.test.ts` ("devuelve null ante texto basura", "devuelve null con lat fuera de [-90, 90]") |
| `RN-LOCATION-03` | Sólo se guarda una ciudad que `listLocations()` devuelve; una desconocida responde `{ ok: false }` sin tocar la cookie. | `features/location/actions.test.ts` ("rechaza una ciudad desconocida sin tocar la cookie") |
| `RN-LOCATION-04` | Una ciudad de la cookie que `describeLocation` no reconoce cuenta como sin ubicación: `getEffectiveLocation` devuelve `{ location: null, name: null }`. | `features/location/server.test.ts` ("una ciudad desconocida cuenta como sin ubicación") |

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Forma o validación del valor de la cookie | `parseLocationCookie` y `serializeLocation` en `cookie.ts` | sus casos en `cookie.test.ts`; una cookie vieja que deje de leerse vale como sin ubicación (RN-LOCATION-02) |
| Opciones de la cookie (duración, `secure`) | `saveLocation` en `actions.ts` | el `toHaveBeenCalledWith` de `actions.test.ts` |
| Textos o pasos del selector | `LocationPicker.tsx` | los nombres accesibles que busca `LocationPicker.test.tsx` |
| Cómo llega la ubicación a la consulta | `toGeoFilter` en `cookie.ts` | `GeoFilter` vive en `lib/marketplace/params.ts` y no se cambia desde acá |
| Qué ubicación cuenta como efectiva | `getEffectiveLocation` en `server.ts` | sus casos en `server.test.ts`; la consumen `LocationBar.tsx` (`LocationBar` y `LocationSummary`), `features/search/SearchResults.tsx`, `features/store/NearbyStores.tsx` y `features/product/ProductOffers.tsx` |

## 4. API pública

Valor de la cookie, `features/location/cookie.ts` (sin dependencias de servidor):

- `LOCATION_COOKIE = "loc"`
- `type UserLocation = { kind: "coords"; lat: number; lng: number } | { kind: "city"; city: string }`
- `isValidCoords(lat: number, lng: number): boolean`
- `parseLocationCookie(raw: string | undefined): UserLocation | null`
- `serializeLocation(loc: UserLocation): string`
- `toGeoFilter(loc: UserLocation | null): GeoFilter`
- `describeLocation(loc: UserLocation | null, states: LocationState[]): string | null`: coordenadas, "Tu ubicación actual"; ciudad, su `name`; ciudad desconocida o `null`, `null`.

Lectura, `features/location/server.ts` (`import "server-only"`):

- `getUserLocation(): Promise<UserLocation | null>`: la cookie tal cual, sin validar la ciudad.
- `getEffectiveLocation(): Promise<{ location: UserLocation | null; name: string | null }>`: la cookie y `listLocations()`; `name` es el de `describeLocation` y, si es `null`, `location` también (RN-LOCATION-04).

Acciones de servidor, `features/location/actions.ts` (`"use server"`):

- `setLocationFromCoords(lat: number, lng: number): Promise<{ ok: boolean }>`
- `setLocationCity(citySlug: string): Promise<{ ok: boolean }>`
- `clearLocation(): Promise<void>`

Componentes:

- `LocationPicker({ label, states }: { label: string | null; states: LocationState[] })`, `features/location/LocationPicker.tsx` (`"use client"`)
- `LocationBar(): Promise<React.JSX.Element>`, Server Component, y `LocationBarSkeleton()`, `features/location/LocationBar.tsx`
- `LocationSummary(): Promise<React.JSX.Element>`, Server Component, y `LocationSummarySkeleton()`, `features/location/LocationBar.tsx`: sólo lectura, "Cerca de: {name}" o "Sin ubicación" con `getEffectiveLocation()`; lo usa la cabecera de `app/layout.tsx`

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| `saveLocation` | `features/location/actions.ts` | escribe `loc` con `httpOnly`, `sameSite: "lax"`, `path: "/"`, `maxAge` de 30 días y `secure` en producción |
| Selector en cascada | `features/location/LocationPicker.tsx` | tres `<select>` (Estado, Municipio, Ciudad); cambiar uno vacía los de abajo |
| Geolocalización | `requestCurrentPosition` en `features/location/LocationPicker.tsx` | `getCurrentPosition` con `timeout: 10000` y `maximumAge: 600000`; si falla, aviso y selector |

## 6. Dependencias

- `lib/marketplace/client.ts`: `listLocations()` en `actions.ts`, `server.ts` y `LocationBar.tsx`.
- `lib/marketplace/params.ts` (`GeoFilter`) y `lib/marketplace/schemas.ts` (`LocationState`), sólo tipos.
- `next/headers` (`cookies`) y `next/navigation` (`useRouter`).
- `components/ui/button.tsx` y `components/ui/skeleton.tsx`.
- `lucide-react` (`MapPin` en `LocationSummary`).

## 7. Ejemplo de uso

```tsx
import { Suspense } from "react";
import { LocationBar, LocationBarSkeleton } from "@/features/location/LocationBar";
import { getEffectiveLocation } from "@/features/location/server";
import { toGeoFilter } from "@/features/location/cookie";

async function Results() {
  const { location } = await getEffectiveLocation();
  const geo = toGeoFilter(location);
  // geo va a searchProducts({ geo, ... }) de lib/marketplace/client.ts
  return null;
}

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

- `LocationBar`, `LocationSummary`, `getUserLocation` y `getEffectiveLocation` leen `cookies()`: quien los usa los envuelve en `<Suspense>` (`cacheComponents: true`) y nunca dentro de `'use cache'`.
- `LocationPicker` no importa `server.ts` ni `lib/marketplace/client.ts`: recibe `states` y `label` por props y escribe la cookie sólo con las acciones de `actions.ts`.
- La cookie es `httpOnly`: el navegador no la lee; tras cada acción el selector llama a `router.refresh()` para que el servidor repinte con la ubicación nueva.
- Las coordenadas se redondean a 3 decimales (unos 100 m) porque el orden por cercanía no necesita más y la cookie no guarda la posición exacta.
- Ubicación denegada o fallida no bloquea nada: se ofrece el selector de ciudad (spec §6).

## 9. Pruebas

- Comando: `npx vitest run features/location`
- `features/location/cookie.test.ts`: lectura de coordenadas y ciudad, basura, lat fuera de rango, redondeo, `toGeoFilter` y `describeLocation`.
- `features/location/server.test.ts`: `getEffectiveLocation` con ciudad desconocida, ciudad conocida y coordenadas.
- `features/location/actions.test.ts`: ciudad desconocida sin tocar la cookie y ciudad válida con las opciones exactas.
- `features/location/LocationPicker.test.tsx`: botones sin ubicación, aviso y selector ante geolocalización fallida, y cascada Estado a Municipio.

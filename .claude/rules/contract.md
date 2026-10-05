---
paths:
  - "lib/marketplace/**"
---

# Contrato con posveapi

La ficha del módulo es `lib/marketplace/README.md`; esto rige al editar `lib/marketplace/`.

1. **Montos como cadena y sin cálculo.** Todo monto es `Money` (`moneySchema`, `^\d+\.\d{2}$`,
   en `schemas.ts`). Nada en el módulo suma, convierte ni redondea: la API calcula. El simulado
   escribe montos y distancias como literales en `mock/fixtures.ts`. Dos excepciones, porque
   simulan lo que calcula la API: `mock/adapter.ts` compara montos con `Number()` para ordenar y
   elegir mínimo y máximo, sin sumar ni redondear; y `mock/money.ts` multiplica y suma los montos
   del carrito y del checkout en céntimos enteros (sin coma flotante), único lugar del repo que lo
   hace. `mock/checkout.ts` calcula además la distancia haversine de una dirección a la tienda para
   decidir si hay entrega, como la API (spec cuentas-y-compras §5.3).
2. **Esquema antes que tipo a mano.** Cada tipo del contrato es `z.infer` de su esquema en
   `schemas.ts`; no se declara un `type` o `interface` paralelo. Los tipos que no son contrato
   (`GeoFilter` en `params.ts`, `MockProduct` en `mock/fixtures.ts`) sí se escriben a mano.
3. **`server-only` en lo que toca la clave.** `http.ts` y `client.ts` abren con
   `import "server-only"`, y todo archivo nuevo que lea `MARKETPLACE_API_KEY` o importe `http.ts`
   también. Fuera de `lib/marketplace/` se entra por `client.ts`: nadie importa `http.ts` ni
   `mock/`; sus constantes (`params.ts`) y tipos (`schemas.ts`) sí se importan directo.
4. **Un campo nuevo entra primero en la spec §3**
   (`posven/.claude/docs/specs/2026-09-26-ecommerce-hiperlocal-design.md`), o en la §4 de
   `posven/.claude/docs/specs/2026-09-29-cuentas-y-compras-design.md` si es de cuentas, y después
   en `schemas.ts`. Ningún campo se renombra ni se quita (spec §3.1, ítem 7).
5. **El simulado pasa los mismos esquemas.** `mock/adapter.ts` exporta las mismas funciones con
   las mismas firmas que `client.ts`, y `__tests__/schemas.test.ts` valida cada respuesta simulada contra su
   esquema. Un campo nuevo se agrega también a `mock/fixtures.ts`.
6. **Consultas sólo por `params.ts`.** `searchQuery`, `suggestionsQuery`, `nearbyProductsQuery`, `storesQuery`, `productQuery`,
   `pageQuery` y `cartFulfillmentQuery` (con `cartFulfillmentBody`, su par del cuerpo de `POST /cart/quote`) fijan las claves y cuándo se envía la ubicación (RN-MARKETPLACE-03); `client.ts`
   las usa todas y el simulado lee la ubicación de las cuatro primeras con `readScope`.
7. **`'use cache'` sólo en funciones que reciben todo por argumento** y no leen la petición, con
   `cacheLife` y `cacheTag` explícitos: `"hours"` en `listCategories`, `listLocations` y
   `listSitemap`; `"minutes"` en `searchProducts`, `getSuggestions`, `listNearbyProducts`, `listNearbyStores`, `getProductOffers` y
   `getStore`, que traen precios por tienda. `getProduct` no tiene caché propia: delega en
   `getProductOffers` sin ubicación.

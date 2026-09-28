---
paths:
  - "lib/marketplace/**"
---

# Contrato con posveapi

La ficha del módulo es `lib/marketplace/README.md`; esto rige al editar `lib/marketplace/`.

1. **Montos como cadena y sin cálculo.** Todo monto es `Money` (`moneySchema`, `^\d+\.\d{2}$`,
   en `schemas.ts`). Nada en el módulo suma, convierte ni redondea: la API calcula. El simulado
   escribe montos y distancias como literales en `mock/fixtures.ts`.
2. **Esquema antes que tipo a mano.** Cada tipo del contrato es `z.infer` de su esquema en
   `schemas.ts`; no se declara un `type` o `interface` paralelo. Los tipos que no son contrato
   (`GeoFilter` en `params.ts`, `MockProduct` en `mock/fixtures.ts`) sí se escriben a mano.
3. **`server-only` en lo que toca la clave.** `http.ts` y `client.ts` abren con
   `import "server-only"`, y todo archivo nuevo que lea `MARKETPLACE_API_KEY` o importe `http.ts`
   también. Fuera de `lib/marketplace/` se entra por `client.ts`: nadie importa `http.ts` ni
   `mock/`; sus constantes (`params.ts`) y tipos (`schemas.ts`) sí se importan directo.
4. **Un campo nuevo entra primero en la spec §3**
   (`posven/.claude/docs/specs/2026-09-26-ecommerce-hiperlocal-design.md`) y después en
   `schemas.ts`. Ningún campo se renombra ni se quita (spec §3.1, ítem 7).
5. **El simulado pasa los mismos esquemas.** `mock/adapter.ts` exporta las mismas funciones con
   las mismas firmas que `client.ts`, y `schemas.test.ts` valida cada respuesta simulada contra su
   esquema. Un campo nuevo se agrega también a `mock/fixtures.ts`.
6. **Consultas sólo por `params.ts`.** `searchQuery` y `storesQuery` fijan las claves y cuándo
   se envía la ubicación (RN-MARKETPLACE-03); `client.ts` y el simulado las usan las dos.
7. **`'use cache'` sólo en funciones que reciben todo por argumento** y no leen la petición:
   `listCategories` y `listLocations`, con `cacheLife` y `cacheTag` explícitos.

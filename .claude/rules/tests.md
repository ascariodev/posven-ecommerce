---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "vitest.config.mts"
  - "e2e/**"
  - "playwright.config.ts"
---

# Pruebas

1. Vitest con entorno `jsdom` (`vitest.config.mts`): alias `@/` a la raíz y `server-only` al
   módulo vacío de Next, así que `http.ts` y `client.ts` se importan sin error. Corre
   `**/*.test.{ts,tsx}` fuera de `node_modules`, `.next` y `e2e`.
2. Las pruebas viven junto al código: `lib/marketplace/params.ts` se prueba en
   `lib/marketplace/params.test.ts`.
3. Se corre dirigido: `npx vitest run <ruta>` (p. ej. `npx vitest run lib/marketplace`).
   `npm test` corre la suite entera.
4. `fetch` y `next/headers` se simulan con `vi` (`vi.stubGlobal`, `vi.mock`); las variables de
   entorno con `vi.stubEnv`, y todo se restaura en `afterEach`, como en
   `lib/marketplace/http.test.ts`. `useRouter` y las acciones de servidor se simulan con
   `vi.mock('next/navigation')` y `vi.mock('<ruta de actions>')`, como en
   `features/location/LocationPicker.test.tsx`.
5. `lib/marketplace/client.ts` no se prueba en vitest: sus funciones con `'use cache'` llaman a
   `cacheLife()`, que fuera de Next lanza "only available with the `cacheComponents` config". Se
   prueban `mock/adapter.ts` y `http.ts`; `client.ts` lo cubren `next build` y el e2e.
6. No se agregan pruebas que no se pidieron, salvo la que reproduce un bug que se corrige.
7. El e2e (`e2e/*.spec.ts`, `playwright.config.ts`) corre en modo simulado con
   `npx playwright test` al cerrar un plan: Chromium con el dispositivo "Pixel 7" contra
   `http://localhost:3000`. `webServer` levanta `npm run dev` con `MARKETPLACE_MODE=mock`, o reusa
   el servidor que ya escucha en ese puerto, que entonces debe correr en modo simulado.

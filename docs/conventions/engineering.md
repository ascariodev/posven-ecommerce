# Ingeniería (posven-ecommerce)

Datos de entorno y flujo que `posven-ecommerce/CLAUDE.md` no repite. Versiones exactas en
`package.json`.

## 1. Pila

- Next.js 16.3.6 (App Router), React 19.2.8, TypeScript 5.
- Tailwind CSS 4 vía `@tailwindcss/postcss`.
- ESLint 9 con `eslint-config-next`.
- zod para los esquemas del contrato con posveapi (`lib/marketplace/`) y, aparte, para los
  formularios (`features/<f>/lib/formSchemas.ts`): espejo de los FormRequests de posveapi, nunca
  más estrictos, con las mismas claves de campo que la API.
- Vitest con Testing Library y jsdom para las pruebas (`vitest.config.mts`).

## 2. Comandos

| Para qué | Comando |
|---|---|
| Tipos | `npx tsc --noEmit` |
| Lint | `npx eslint <rutas>` |
| Pruebas | `npx vitest run <ruta>` |
| Build | `npx next build` |
| E2E, antes de cerrar un plan | `npx playwright test` (modo simulado; `playwright.config.ts`) |
| Desarrollo | `npm run dev` (puerto 3000) |

## 3. Ramas

Rama base `main`.

## 4. Estructura de un módulo

Cada `features/<f>/` separa por carpetas la frontera servidor/cliente. Ejemplo: `features/cart/`.

| Carpeta | Contenido |
|---|---|
| `components/` | Todo `.tsx`. |
| `server/` | Lo que abre con `"use server"` o `import "server-only"`, o importa algo que lo hace; `server.ts` se llama `server/<f>.ts`. |
| `lib/` | El resto de `.ts`: puro, importable desde un Client Component. |
| `__tests__/` | Todos los `*.test.ts(x)`, planos; los datos de prueba, en `__tests__/fixtures/`. |

- `README.md` se queda en la raíz de la feature.
- Dentro de la feature, los imports son relativos (`../server/actions`); entre features, desde
  `app/` y en las pruebas, por `@/features/<f>/<carpeta>/<archivo>`.
- Sin barriles (`index.ts`): uno que reexporte `server/` y `components/` arrastra `server-only` al
  bundle del cliente.
- `eslint.config.mjs` lo vigila: `features/*/lib/**` no importa `server-only`, `next/headers`,
  `**/server/**` ni `@/lib/marketplace/client|http`, y nada fuera de `__tests__/` importa de
  `**/__tests__/**`.

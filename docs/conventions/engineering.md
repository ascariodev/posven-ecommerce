# Ingeniería (posven-ecommerce)

Datos de entorno y flujo que `posven-ecommerce/CLAUDE.md` no repite. Versiones exactas en
`package.json`.

## 1. Pila

- Next.js 16.3.6 (App Router), React 19.2.8, TypeScript 5.
- Tailwind CSS 4 vía `@tailwindcss/postcss`.
- ESLint 9 con `eslint-config-next`.
- zod para los esquemas del contrato con posveapi (`lib/marketplace/`).
- Vitest con Testing Library y jsdom para las pruebas (`vitest.config.mts`).

## 2. Comandos

| Para qué | Comando |
|---|---|
| Tipos | `npx tsc --noEmit` |
| Lint | `npx eslint <rutas>` |
| Pruebas | `npx vitest run <ruta>` |
| Build | `npx next build` |
| Desarrollo | `npm run dev` (puerto 3000) |

## 3. Ramas

Rama base `main`.

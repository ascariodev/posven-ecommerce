@AGENTS.md

# posven-ecommerce

Buscador web de productos por cercanía sobre el inventario y los precios de las tiendas que usan
posven. Next.js 16 (App Router), React 19, TypeScript y Tailwind CSS v4. Spec:
`posven/.claude/docs/specs/2026-09-26-ecommerce-hiperlocal-design.md`.

## No negociable

1. **El frontend no calcula montos**: no suma, no convierte moneda, no aplica impuestos. Muestra
   las cadenas decimales que entrega la API (spec §3.1).
2. **El navegador nunca llama a posveapi.** Sólo el servidor de Next, con la clave de servidor
   (spec §2).
3. **Los tipos y esquemas del contrato con posveapi viven en `lib/marketplace/`**, y un campo del
   contrato no cambia sin cambiar antes la spec §3.

## Árbol de trabajo

Rama base `main`. Un repo por commit: un cambio que también toca posveapi se commitea allá por
separado.

## Verificación

Mientras trabajas: `npx tsc --noEmit` y `npx eslint <archivos>`. Antes de cerrar: además
`npx vitest run <área>`, y `npx next build` si se tocaron rutas, metadatos o caché. Nada se
reporta como pasando sin haberse corrido.

## Documentos

`docs/conventions/` tiene `engineering.md`, `lessons.md` (se lee entero antes de planificar) y
`README.template.md`. Specs y planes propios del repo en `docs/specs/` y `docs/plans/`.

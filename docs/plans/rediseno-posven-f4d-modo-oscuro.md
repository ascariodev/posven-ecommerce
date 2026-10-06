# Plan: rediseño E · F4d, modo oscuro y retiro de /preview

**Objetivo:** que el usuario pueda pasar a modo oscuro con un interruptor en el menú de cuenta y en
el pie, que sin preferencia guardada el sitio siga al sistema sin parpadeo, que el `Toaster` siga
el tema (M-4 de F0) y que `/preview` deje de existir.
**Estado:** en curso · Fase actual: 4

## Contexto mínimo
- Spec: `docs/specs/2026-10-03-rediseno-posven-design.md` §2 (fila "Modo oscuro" y "Prueba
  previa"), §3 (`themeColor`: F4 suma la variante oscura por `media`), §4 (`ui.md`), §6 (F4) y §9
  (`/preview`). Lienzo: `docs/design/2026-10-03-rediseno/movil/P11-Cuenta.dc.html:67` y
  `maqueta/_screens/cuenta.tsx:158-166` (fila "Modo oscuro" con ícono `Moon` y `role="switch"`);
  `web/W11-Cuenta.dc.html:60` sólo enlaza. `docs/design/` está sin trackear y es ajeno: sólo se lee.
- Repo y rama: `posven-ecommerce` en `C:\Users\Windows 11\Documents\Development\posven\posven-ecommerce`,
  rama `feat/rediseno-f4d-modo-oscuro` (se crea desde `main`, 9e6ae61, en la fase 1).
- Estado de partida (exploración 2026-10-05):
  - `app/globals.css` ya tiene `@custom-variant dark (&:is(.dark *))` (:5) y `.dark` (:48-86) con
    los 39 tokens de color de `:root`. No hay `next-themes` ni ningún provider.
  - `app/layout.tsx`: `<html lang="es" className=...>` (:39) sin `suppressHydrationWarning`;
    `viewport.themeColor: "#ffffff"` (:31-33); `<Toaster offset mobileOffset />` (:47).
  - `components/ui/sonner.tsx` fija `theme="light"` (:8) y pinta con `--popover`,
    `--input-border` y `--radius` (:19-22).
  - Menú de cuenta: `features/account/lib/accountLinks.ts`, `components/AccountOverviewMenu.tsx`
    (lista móvil en `/cuenta`) y `components/AccountNav.tsx` (aside y pestañas). Pie:
    `features/site/components/SiteFooter.tsx`.
  - `/preview`: `app/preview/page.tsx` y `app/preview/ToastButton.tsx`; la nombran `app/robots.ts:8`,
    `e2e/product.spec.ts:94` y `.claude/rules/seo.md:33,54`. El "preview" de
    `features/events/lib/handle.ts:9` es del regex de bots y no se toca.
- Restricciones: `cacheComponents` (regla `app-router` ítem 2): la preferencia se lee en el
  cliente (localStorage de `next-themes` y su script), nunca con `cookies()` en el layout. Lo que
  depende del tema se pinta tras hidratar (L-10). Colores sólo por tokens; un componente no usa
  `dark:` salvo lo que shadcn trae (`ui.md` ítem 4). AA en claro y oscuro (`ui.md` ítem 5).
- Verificación: `"<repo>/node_modules/.bin/tsc" --noEmit -p "<repo>/tsconfig.json"`,
  `npx --prefix <repo> vitest run --root <repo> <áreas>`, `eslint -c <repo>/eslint.config.mjs` de
  lo tocado, e2e afectado; al cerrar, `next build` y `npx playwright test` completo.

## Fases

### [x] Fase 1 — Proveedor de tema y Toaster
- **Repo:** posven-ecommerce
- **Alcance:** rama desde `main`. Instalar `next-themes` (versión verificada contra React 19 y Next
  16 antes de instalar). `ThemeProvider` cliente en `features/site/components/` con
  `attribute="class"`, `defaultTheme="system"`, `enableSystem` y `disableTransitionOnChange`,
  montado en `app/layout.tsx` alrededor del `body`; `suppressHydrationWarning` en `<html>`.
  `viewport.themeColor` pasa a la pareja por `media` (`prefers-color-scheme: light` con `#ffffff`
  y `dark` con el `--card` oscuro de `globals.css`, convertido a hex), sin otro hex nuevo.
  `components/ui/sonner.tsx` toma el tema de `useTheme()` (`resolvedTheme`) en vez de `"light"` y
  define la clase `cn-toast` (M-4 de F0). Spec §2, §3 y §9 al día con las decisiones de este plan;
  README de `features/site`. Sin interruptor todavía: con el sistema en oscuro el sitio ya sale
  oscuro.
- **Archivos:** `package.json` (y lock), `features/site/components/ThemeProvider.tsx`,
  `app/layout.tsx`, `components/ui/sonner.tsx`, `features/site/README.md`, la spec; la M-4 se
  marca `[x]` en `docs/plans/terminados/rediseno-posven-f0-base-visual.md`.
- **Terminado cuando:** tsc limpio, vitest de `features/site` en verde, un e2e en `e2e/site.spec.ts`
  con `page.emulateMedia({ colorScheme: "dark" })` que encuentra `html.dark` y otro sin él que no la
  tiene, sin avisos de hidratación en consola, y `e2e/cart.spec.ts` (toasts) en verde.
- **Commit:** `feat(site): tema claro y oscuro con next-themes`

### [x] Fase 2 — Interruptor de modo oscuro en el pie
- **Repo:** posven-ecommerce
- **Alcance:** primitiva `Switch` de shadcn (estilo `radix-luma`, con el ajuste de import de
  `cn` que pide `ui.md`) y su alta en la lista de primitivas de `ui.md`; `ThemeSwitch` cliente
  (ícono `Moon`, "Modo oscuro", `role="switch"`, `aria-checked` del tema resuelto, pintado tras
  hidratar para no desajustar) que fija `light` o `dark`; montado en `SiteFooter`. README de site.
- **Terminado cuando:** tsc, vitest de site (prueba de `ThemeSwitch`) y un e2e que lo activa, ve
  `html.dark`, recarga y lo conserva.

### [x] Fase 3 — Interruptor en el menú de cuenta
- **Repo:** posven-ecommerce
- **Alcance:** `ThemeSwitch` como fila de la lista móvil (`AccountOverviewMenu`, entre los enlaces
  y "Cerrar sesión", como P11) y en el aside de escritorio (`AccountNav`). README de account.
- **Terminado cuando:** tsc, vitest de account y e2e de cuenta en verde (incluido el interruptor).

### [ ] Fase 4 — Retiro de /preview
- **Repo:** posven-ecommerce
- **Alcance:** borrar `app/preview/`; quitar `/preview` de `app/robots.ts`, del e2e de robots
  (`e2e/product.spec.ts:94`) y de `.claude/rules/seo.md` (ítems 3 y 8); spec §9 marcada como
  retirada. Cierre del plan y revisión contra el lienzo en claro y oscuro.
- **Terminado cuando:** tsc, `next build` (sin la ruta) y `npx playwright test` completo en verde.

## Decisiones
- 2026-10-05 — El tema se maneja con `next-themes` (dependencia nueva), como pedía la M-4 de F0.
  Elegido por el usuario.
- 2026-10-05 — Sin preferencia guardada el sitio sigue al sistema (`prefers-color-scheme`); el
  interruptor es de dos estados (claro u oscuro) como el lienzo, y desde que se usa manda la
  elección. Elegido por el usuario.
- 2026-10-05 — El interruptor va en el menú de cuenta (móvil y escritorio) y en el pie, para quien
  no inició sesión. Elegido por el usuario.

## Notas para la próxima sesión
- Fases 1 a 3 cerradas. Sigue la fase 4. Los e2e `account.spec.ts` y `account-desktop.spec.ts`
  comparten el simulado en memoria y fallan con más de un worker (previo al plan, ver M-5): la
  suite completa se corre con `--workers=1` si aparece ese fallo.

## Mejoras propuestas
- [ ] M-1 — Foco visible en los enlaces del pie: `linkClass` de `features/site/components/SiteFooter.tsx` con `outline-ink-foreground` (posven-ecommerce · baja · haiku)
- [ ] M-2 — Regla en `.claude/rules/ui.md` (ítem 5) sobre pintar una primitiva sobre `bg-ink`: clases `ink` por `className` y `!` para pisar el `dark:` de shadcn; promueve L-14 (posven-ecommerce · baja · sonnet)
- [ ] M-3 — e2e de foco con teclado sobre el interruptor del pie (Tab y contorno visible) en `e2e/site.spec.ts` (posven-ecommerce · baja · sonnet)
- [ ] M-4 — Refrescar `features/merchants/README.md` y `features/search/README.md`, RANCIO por `e2e/site.spec.ts`, `MerchantContact.tsx` y `SiteHeader.tsx` (posven-ecommerce · baja · haiku)
- [ ] M-5 — Fijar `workers: 1` (o aislar el simulado) en `playwright.config.ts`: `account.spec.ts` y `account-desktop.spec.ts` interfieren con más de un worker (`.claude/rules/tests.md` ítem 7) (posven-ecommerce · media · sonnet)
- [ ] M-6 — Track por defecto de `components/ui/switch.tsx` bajo 3:1 sobre `bg-card` en claro: corregir la primitiva si aparece un tercer uso, en vez de clases por contexto (posven-ecommerce · media · sonnet)

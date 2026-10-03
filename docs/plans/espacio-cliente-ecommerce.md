# Plan: espacio-cliente-ecommerce

**Objetivo:** `/cuenta` con la dirección B "Ficha de cliente": barra lateral con la ficha del
cliente en escritorio, pestañas subrayadas en el teléfono, páginas en panel y resumen que destaca
el código de retiro. Sin cambios de contrato.
**Estado:** en curso · Fase actual: 5

## Contexto mínimo
- Spec: sin spec (camino acotado de `design-phase`, sólo visual). Referencia aprobada: dirección B
  del artifact https://claude.ai/artifact/TNbAxD22wLEeAAva97GSCK; las decisiones de abajo mandan.
- Repos y ramas: `posven-ecommerce` en `C:\Users\Windows 11\Documents\Development\posven\posven-ecommerce`,
  rama `main` (se trabaja directo en `main`; push sólo a pedido).
- Restricciones: sólo tokens de `app/globals.css` (`.claude/rules/ui.md` 4), íconos de
  `lucide-react`, controles de 44 px en móvil, foco con `outline-foreground`; `cacheComponents`:
  toda lectura de sesión dentro de `<Suspense>` (`.claude/rules/app-router.md` 2); "Mis compras"
  sigue atada a `cartEnabled()`; el botón "Mi cuenta" de la cabecera y el texto "no está
  verificado" del aviso del resumen se conservan (los usan `e2e/account.spec.ts`,
  `e2e/cart.spec.ts` y `e2e/checkout.spec.ts`). Lecciones L-05 (Salir dentro de un menú) y L-03
  (movimiento reducido).
- Archivos principales: `app/cuenta/layout.tsx`, `app/cuenta/page.tsx`,
  `features/account/components/AccountDropdown.tsx`, `features/purchases/components/RecentPurchases.tsx`,
  `features/purchases/components/PurchaseList.tsx`, `features/account/README.md`,
  `features/purchases/README.md`.

## Fases

### [x] Fase 1 — Navegación única de la cuenta
- **Repo:** posven-ecommerce
- **Alcance:**
  - Una sola lista de enlaces de la cuenta (`href`, etiqueta, ícono de lucide) con "Mis compras"
    filtrada por un booleano que decide el servidor (`cartEnabled()`), como hoy.
    `AccountDropdown` deja su `SUMMARY_LINK`/`PURCHASES_LINK`/`MENU_LINKS` y usa esa lista.
  - `AccountNav` (`"use client"`): desde `lg`, barra lateral (tarjeta `bg-card border-border
    shadow-card`, ítems con ícono en cuadro `bg-muted` que pasa a `bg-primary
    text-primary-foreground` en la activa, flecha a la derecha, "Salir" al pie); por debajo de
    `lg`, pestañas subrayadas desplazables en horizontal (activa con borde inferior `primary`).
    La activa lleva `aria-current="page"` según `usePathname()` (Resumen sólo en `/cuenta` exacto;
    "Mis compras" también en `/cuenta/compras/<código>`), y en el teléfono la pestaña activa se
    desplaza a la vista al montar. "Salir" es un `<form action={logout}>` con botón `submit`
    (fuera de un menú, L-05 no aplica).
  - `app/cuenta/layout.tsx`: grilla `lg:grid-cols-[248px_minmax(0,1fr)]`, `AccountNav` y los
    hijos dentro de un panel (`bg-card border border-border rounded-lg shadow-card p-4 lg:p-6`).
    Antes de usar `usePathname` con `cacheComponents`, leer su guía en `node_modules/next/dist/docs/`;
    si la ruta dinámica `/cuenta/compras/[codigo]` lo pide, `AccountNav` va en `<Suspense>` con un
    esqueleto de su misma altura.
  - README de `features/account`: interfaz de `AccountNav` y de la lista, fila de "Una pantalla
    nueva de `/cuenta`" (el enlace se agrega sólo en la lista) y fila de "Pantallas de cuenta".
- **Archivos:** `features/account/lib/accountLinks.ts` (nuevo), `features/account/components/AccountNav.tsx`
  (nuevo), `features/account/components/AccountDropdown.tsx`, `app/cuenta/layout.tsx`,
  `features/account/README.md`
- **Terminado cuando:** `node_modules/.bin/tsc --noEmit -p <repo>/tsconfig.json` y
  `npx eslint <archivos>` sin errores nuevos; `npx vitest run features/account` en verde
  (`AccountMenu.test.tsx` sigue pasando); `npx next build` compila sin aviso `blocking-route` en
  `/cuenta*`.
- **Commit:** `feat(account): navegación lateral y pestañas de la cuenta`

### [x] Fase 2 — Ficha del cliente en la navegación
- **Repo:** posven-ecommerce
- **Alcance:** `AccountIdentity` (Server Component) con iniciales sobre `bg-primary-soft`, nombre,
  correo y chip de estado ("Correo verificado" `tint-3` / "Correo sin verificar" `tint-1`), leído
  con `getCurrentCustomer()` en `<Suspense>` dentro del layout; cabecera de la tarjeta lateral en
  `lg` y franja compacta sobre las pestañas en el teléfono. Comprobar que guardar el perfil o
  verificar el correo refresca la ficha (el layout no se vuelve a pintar al navegar entre hijos).
  README de `features/account`.
- **Terminado cuando:** tsc, eslint y `npx vitest run features/account` en verde; `npx next build`.

### [x] Fase 3 — Código de retiro en el resumen
- **Repo:** posven-ecommerce
- **Alcance:** `RecentPurchases` lee la página 1 una sola vez y pinta arriba la tarjeta "Para
  retirar" (`bg-primary-soft`, tienda, compra, código grande con enlace al detalle) del primer
  pedido `ready_for_pickup` con `pickup_code` no nulo; `app/cuenta/page.tsx` quita la grilla de
  atajos (la cubre la navegación) y ordena: saludo, avisos de correo, retiro, últimas compras.
  Pruebas de `RecentPurchases.test.tsx` y fila nueva en las reglas del README de `features/purchases`.
- **Terminado cuando:** `npx vitest run features/purchases` en verde con el caso del retiro; tsc y eslint.

### [x] Fase 4 — Listas de compras en una tarjeta
- **Repo:** posven-ecommerce
- **Alcance:** `PurchaseRow` pasa a fila con separador dentro de una sola tarjeta (código, fecha y
  tiendas, chip de estado, monto en USD con Bs debajo), en `PurchaseList` y en `RecentPurchases`;
  títulos de `/cuenta/compras` y del detalle al tamaño común de la cuenta, sin `max-w-*` (manda el
  panel). README de `features/purchases`.
- **Terminado cuando:** `npx vitest run features/purchases` en verde; tsc y eslint.

### [ ] Fase 5 — Páginas internas en el panel
- **Repo:** posven-ecommerce
- **Alcance:** perfil (campos en dos columnas desde `sm`), direcciones (tarjetas en dos columnas y
  "Agregar dirección" junto al título), favoritos (productos y tiendas como filas de una tarjeta) y
  configuración (secciones en tarjetas); título común `text-2xl` y sin `max-w-*`. Sin tocar
  formularios ni acciones.
- **Terminado cuando:** tsc, eslint y `npx vitest run features/account` en verde; al cerrar el plan
  `npx next build` y `npx playwright test` (e2e de cierre de `.claude/rules/tests.md` 7).

## Decisiones
- 2026-10-03 — Dirección B "Ficha de cliente" sobre A y C — el usuario la eligió entre las tres del artifact.
- 2026-10-03 — Camino acotado sin spec — sólo visual, sin contrato ni reglas de negocio nuevas.
- 2026-10-03 — Barra lateral desde `lg`, pestañas por debajo — con `max-w-5xl` en `<main>`, en `md` el panel quedaría en ~450 px.
- 2026-10-03 — El menú desplegable de la cabecera se conserva y comparte la lista con la barra lateral.
- 2026-10-03 — La tarjeta de retiro muestra sólo el primer pedido listo; los demás siguen en "Últimas compras".
- 2026-10-03 — Fase 1: `accountLinks(showPurchases)` e `isActiveLink(href, pathname)` en `features/account/lib/accountLinks.ts` (módulo puro). `AccountNav` va en `<Suspense fallback={<AccountNavSkeleton />}>` en el layout (lo exige `usePathname` en `/cuenta/compras/[codigo]`). Barra lateral y pestañas son dos `<nav aria-label="Mi cuenta">` alternados con `hidden lg:block` / `lg:hidden`.
- 2026-10-03 — Fase 2: `AccountNav` recibe además `identity` y `compactIdentity` (ReactNode); el layout pasa `<AccountIdentity />` y `<AccountIdentity compact />`, cada una en su `<Suspense>`. `getCurrentCustomer` ya va en `cache()`, así que hay una sola lectura de `getMe` por petición. Iniciales calculadas en el componente, sin `storeInitials`.
- 2026-10-03 — Fase 3: `RecentPurchases` devuelve un fragmento con dos secciones, la tarjeta (`region` "Para retirar") fuera de la lista "Últimas compras" (no cambia el conteo de `checkout.spec.ts:107`). Regla nueva `RN-PURCHASES-04` en el README de `features/purchases`.
- 2026-10-03 — Fase 4: `PurchaseRows({ purchases, label })` exportado de `PurchaseList.tsx` pinta el `<ul aria-label>` como una sola tarjeta y lo usan `PurchaseList` y `RecentPurchases`; `PurchaseRow` y `purchaseHref` conservan firma. Títulos de compras y detalle a `text-2xl`, sin `max-w-3xl`.

## Notas para la próxima sesión
- Fases 1 a 4 cerradas. Los 6 e2e rotos por el rediseño de Jose (tienda oculta como "Comercio
  Aliado", sin contacto) siguen fallando y no son de este plan. `docs-check` marca rancio el README
  de `features/account` por archivos ajenos al plan; ya venía así.
- El refresco de la ficha, la tarjeta "Para retirar" y las filas de compras no se vieron en el
  navegador; verificarlos en el e2e de cierre o a mano.
- Fase 5: el `h1` "Hola, ..." de `app/cuenta/page.tsx` sigue en `text-3xl`; alinearlo al `text-2xl` común.

## Mejoras propuestas
- [ ] M-1 — `AccountNav`: el `useEffect` que desplaza la pestaña activa depende de `[]`; el layout
  persiste entre rutas hijas y al navegar en el teléfono no se recentra. Usar `[pathname]`.
  posven-ecommerce · baja · sonnet
- [ ] M-2 — Prueba de `isActiveLink` (Resumen sólo en `/cuenta` exacto, "Mis compras" también en
  `/cuenta/compras/<código>`) en `features/account/__tests__/accountLinks.test.ts`.
  posven-ecommerce · baja · sonnet
- [ ] M-3 — Prueba de `AccountIdentity` (iniciales, chip verificado y sin verificar, `null` sin
  comprador) en `features/account/__tests__/AccountIdentity.test.tsx`; hoy el paso de `identity` y
  `compactIdentity` del layout a `AccountNav` sólo lo cubre el build.
  posven-ecommerce · baja · sonnet
- [ ] M-4 — `PickupCard` en `RecentPurchases.tsx` pone el `<h2>` dentro del `<Link>` y el enlace se
  lee como encabezado más código: sacar el `h2` del enlace. De paso, una sola línea en blanco en
  `app/cuenta/page.tsx:15-16`.
  posven-ecommerce · baja · sonnet
- [ ] M-5 — e2e de la tarjeta "Para retirar" en `/cuenta` (`e2e/checkout.spec.ts`, flujo de compra
  completa) si el simulado deja un pedido `ready_for_pickup`.
  posven-ecommerce · media · sonnet
- [ ] M-6 — Separador `sr-only` (" · ") entre USD y Bs en la fila de compra (`PurchaseList.tsx`) y
  devolver `PurchaseList.test.tsx` a `"$ 6,70 · Bs 244,55"`.
  posven-ecommerce · baja · sonnet

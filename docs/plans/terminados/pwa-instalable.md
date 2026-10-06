# Plan: PWA instalable

**Objetivo:** el ecommerce se puede instalar en el teléfono y el escritorio (manifest e íconos
propios con la marca), sin service worker ni funcionamiento sin conexión.
**Estado:** terminado

## Contexto mínimo
- Spec: sin spec (no toca el contrato con posveapi). Guías de Next en `node_modules/next/dist/docs/`:
  `manifest.md`, `app-icons.md`, `generate-image-metadata.md`, `image-response.md`,
  `progressive-web-apps.md` (regla `app-router` punto 1).
- Repos y ramas: `posven-ecommerce` en `C:/Users/Windows 11/Documents/Development/posven/posven-ecommerce`,
  rama `feat/pwa-instalable` desde `main`.
- Restricciones: sin service worker ni caché offline (precios y stock deben estar al día); marca
  sólo por `SITE_NAME` (regla `app-router` punto 8); colores de la marca en `app/globals.css`
  (`--ink` `#28292d`, `--primary` `#ff9d1a`, `--background` `#fafafb`, oscuro `#1c1d20`); el push a
  `main` despliega solo.
- Archivos principales: `app/layout.tsx` (`metadata`, `viewport.themeColor`),
  `features/site/components/SiteHeader.tsx:35-40` (marca actual: "p" en `text-primary` sobre
  `bg-ink`, `rounded-xl`), `app/favicon.ico` (el de la plantilla inicial de Next), `lib/site.ts`.

## Fases

### [x] Fase 1 — Íconos de la marca generados
- **Repo:** posven-ecommerce
- **Alcance:** íconos con `ImageResponse` de `next/og`, sin binarios en el repo, que reproducen
  la marca de la cabecera (la inicial de `SITE_NAME` en naranja sobre tinta). `app/icon.tsx` con
  `generateImageMetadata`: 32 px (pestaña), 192 y 512 px (`purpose: any`, esquinas redondeadas) y
  512 px maskable (fondo tinta a sangre, letra dentro de la zona segura del 80 %).
  `app/apple-icon.tsx` de 180 px, sin transparencia. El dibujo vive en un solo lugar
  (`features/site/lib/brand-icon.tsx`) y recibe tamaño y variante. Se borra `app/favicon.ico`.
  Tipografía: la que trae `ImageResponse` por defecto; cargar Poppins queda como mejora si se
  pide.
- **Archivos:** `features/site/lib/brand-icon.tsx`, `app/icon.tsx`, `app/apple-icon.tsx`,
  `app/favicon.ico` (borrado), `features/site/README.md`.
- **Terminado cuando:** `tsc --noEmit`, `eslint` de los archivos y `npx next build` pasan; con
  `next start`, cada `/icon/<id>` y `/apple-icon` responde 200 `image/png` con su tamaño, y el
  `<head>` de `/` trae los `<link rel="icon">` y `apple-touch-icon`.
- **Commit:** `feat(site): íconos de la marca generados`

### [x] Fase 2 — Manifest e instalación
- **Repo:** posven-ecommerce
- **Alcance:** `app/manifest.ts` (`name`, `short_name` de `SITE_NAME`, `description`,
  `start_url: "/"`, `display: "standalone"`, colores de la marca, `lang: "es"`, íconos de la fase 1
  con sus `purpose`), `appleWebApp` en el `metadata` del layout, README de `features/site` y caso
  e2e en `e2e/site.spec.ts` (manifest con sus campos e íconos que responden 200).
- **Terminado cuando:** `tsc`, `eslint`, `npx next build` y `npx playwright test` en modo
  simulado pasan.
- **Commit:** `feat(site): manifest para instalar el sitio`

## Decisiones
- 2026-10-06 — Instalable sin offline: sin service worker; el sitio necesita conexión
  (pedido del usuario).
- 2026-10-06 — Aprobado: ícono con la marca de la cabecera generado por código, tipografía por
  defecto de `ImageResponse` (Poppins queda como mejora), y `app/favicon.ico` de Next se reemplaza.
- 2026-10-06 — Fase 1: el dibujo es `brandIcon(size, variant)` en `features/site/lib/brand-icon.tsx`.
  Ids de `app/icon.tsx`: `32`, `192`, `512` y `maskable`, servidos en `/icon/<id>`; `/apple-icon`
  de 180 px con variante `bleed`. `generateImageMetadata` no admite `purpose`: `any` y `maskable`
  se declaran en el manifest (fase 2). Next enlaza también el maskable como `<link rel="icon">`
  (inevitable, anotado en el README). En el maskable la letra ocupa la mitad del lado.
- 2026-10-06 — Fase 2: manifest con `theme_color` `#28292d` (tinta) y `background_color` `#fafafb`;
  el layout conserva `viewport.themeColor` por modo. `appleWebApp` con `capable`, `title: SITE_NAME`
  y `statusBarStyle: "default"`. `features/site/README.md` re-verificado (`verified_at` `b0bed8d`).

## Notas para la próxima sesión
- Plan terminado 2026-10-06 en `feat/pwa-instalable` (b0bed8d, ee4a7c6), sin merge ni push.

## Mejoras propuestas
- [ ] M-1 — `app/icon.tsx`: `ICONS[String(await id)]` revienta con un id desconocido; Next sólo
  pide los declarados, pero un `notFound()` defensivo lo cierra.
  posven-ecommerce · baja · sonnet
- [ ] M-2 — Cargar Poppins en negrita en `brandIcon` para igualar la marca de la cabecera (la
  tipografía por defecto de `ImageResponse` sale sin negrita).
  posven-ecommerce · baja · sonnet
- [ ] M-3 — `theme_color` del manifest es la tinta fija, pero `viewport.themeColor` usa `#ffffff`
  en claro: en Android la barra de la app instalada sale oscura con el sistema en claro. Alinear o
  dejar la decisión escrita.
  posven-ecommerce · baja · sonnet
- [ ] M-4 — `e2e/site.spec.ts`: los colores del manifest se comparan en hexadecimal fijo; leerlos
  de una constante compartida con `app/manifest.ts`.
  posven-ecommerce · baja · sonnet

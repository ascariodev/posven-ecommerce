# Plan: PWA instalable

**Objetivo:** el ecommerce se puede instalar en el teléfono y el escritorio (manifest e íconos
propios con la marca), sin service worker ni funcionamiento sin conexión.
**Estado:** en curso · Fase actual: 1

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

### [ ] Fase 1 — Íconos de la marca generados
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

### [ ] Fase 2 — Manifest e instalación
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

## Notas para la próxima sesión
- Plan aprobado 2026-10-06; rama `feat/pwa-instalable` creada desde `main`. Sigue la fase 1.

## Mejoras propuestas

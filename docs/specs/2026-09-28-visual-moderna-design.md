# Visual moderna del ecommerce

- Fecha: 2026-09-28
- Estado: aprobado
- Repos: posven-ecommerce
- Spec del rasgo: `posven/.claude/docs/specs/2026-09-26-ecommerce-hiperlocal-design.md` (esta
  spec no cambia su contrato §3, sus rutas ni sus metadatos §4)

## 1. Objetivo y alcance

Renovar la visual del buscador con la dirección "suave con vidrio": fondo cálido con degradado
suave, buscador y cabecera translúcidos, tarjetas redondeadas con sombra cálida. La estructura de
cada página, sus textos, su HTML semántico, sus metadatos y el contrato con posveapi no cambian.

Entra todo lo que existe: tokens (`app/globals.css`), primitivas (`components/ui/`), layout
(`app/layout.tsx`), inicio, `/buscar`, `/p/[slug]`, `/tienda/[slug]`, el selector de ubicación,
`app/error.tsx` y `app/not-found.tsx`. Las landings del plan D nacen con este estilo. Queda afuera
el backoffice de posveapi, el modo oscuro y las transiciones de vista (`<ViewTransition>`).

## 2. Decisiones

| Tema | Decisión |
|---|---|
| Dirección | "Suave con vidrio" (descartadas: cálida redondeada, minimal editorial, tipo app, bento, mapa primero, oscura) |
| Íconos | `lucide-react` (versión vigente al instalar: 1.48.0), única librería de íconos permitida |
| Tipografía | Plus Jakarta Sans por `next/font/google` (`Plus_Jakarta_Sans`), en lugar de Geist |
| Cabecera | Fija y translúcida; buscador compacto y ciudad en `/p` y `/tienda`, no en `/` ni `/buscar` |
| Sin imagen | Ícono de la categoría raíz sobre tinte cálido; tienda sin logo, iniciales sobre el mismo tinte |
| Movimiento | Sutil con CSS; nada con `prefers-reduced-motion: reduce` |

## 3. Tokens

En `:root` de `app/globals.css`, con su `--color-*` en `@theme inline`. Se conservan con su valor
`--primary` (`#f7900a`), `--primary-hover` (`#db820e`), `--primary-foreground` (`#262627`),
`--foreground` (`#262627`), `--muted-foreground` (`#595959`), `--input-border` (`#8c8c8c`),
`--featured` (`#fff4e5`) y `--warning` (`#8a4b00`). Cambian o entran:

| Token | Valor | Uso |
|---|---|---|
| `--background` | `#fffaf3` | base del cuerpo, debajo del degradado |
| `--muted` | `#f7efe4` | hover de fila, esqueleto, fondo neutro |
| `--border` | `#efe3d3` | separadores y borde de tarjetas |
| `--surface` | `rgb(255 255 255 / 0.92)` | tarjetas de lista (sin desenfoque) |
| `--glass` | `rgb(255 255 255 / 0.72)` | cabecera fija y buscador grande (con desenfoque) |
| `--glass-border` | `rgb(255 255 255 / 0.9)` | borde de las superficies de vidrio |
| `--primary-soft` | `#fde3c0` | tinte detrás de íconos de reemplazo e iniciales |
| `--elevation-card` | `0 1px 2px rgb(38 38 39 / 0.04), 0 8px 24px rgb(138 75 0 / 0.08)` | tarjeta en reposo |
| `--elevation-raised` | `0 2px 4px rgb(38 38 39 / 0.05), 0 16px 32px rgb(138 75 0 / 0.12)` | tarjeta en hover y cabecera al desplazar |

Las sombras entran en `@theme inline` como `--shadow-card: var(--elevation-card)` y
`--shadow-raised: var(--elevation-raised)` (clases `shadow-card` y `shadow-raised`). El degradado vive en una capa fija detrás del contenido
(`body::before`, `position: fixed`, `inset: 0`, `z-index: -1`), no en `background-attachment:
fixed`, que falla en Safari móvil: `radial-gradient(60% 50% at 0% 0%, #ffe6c7, transparent)`,
`radial-gradient(50% 40% at 100% 0%, #ffe4dc, transparent)` sobre `--background`.

Contraste medido (WCAG): `#595959` sobre `#fffaf3` 6,74:1 y sobre `#ffe6c7` 5,80:1; `#262627`
sobre `#f7900a` 6,44:1; `#8a4b00` sobre `#fde3c0` 5,48:1; `#8c8c8c` sobre `#fffaf3` 3,24:1 (borde
de control, mínimo 3:1). El foco visible sigue en `outline-foreground`.

## 4. Forma y tipografía

- Radios: tarjetas `rounded-2xl`, controles (`Input`, `Button`) `rounded-xl`, `Badge` y chips de
  categoría `rounded-full`, imágenes dentro de tarjeta `rounded-xl`.
- `Card` pasa a `bg-surface border-border shadow-card`; una tarjeta enlazada suma en hover
  `shadow-raised` y `-translate-y-0.5`.
- El desenfoque (`backdrop-blur-md` con `bg-glass border-glass-border`) va sólo en la cabecera
  fija y en el buscador grande de `/` y `/buscar`. Ninguna tarjeta de lista lo lleva, para no
  castigar a los teléfonos de gama baja.
- Plus Jakarta Sans con `variable: "--font-sans-brand"` y `--font-sans` apuntando a ella. Títulos
  `font-bold tracking-tight`; el precio en USD de una tarjeta, `text-xl font-bold`; el de Bs se
  queda en `text-sm`.
- `themeColor` del viewport se queda en `#f7900a`.

## 5. Cabecera

`app/layout.tsx` pinta un `<header>` `sticky top-0 z-40` con `bg-glass backdrop-blur-md`, borde
inferior `border-glass-border` y la marca por `SITE_NAME`. En `/p/[slug]` y `/tienda/[slug]` lleva
además el buscador compacto (`SearchForm` en tamaño chico, mismo `action="/buscar"`, misma
etiqueta "Buscar productos") y la ciudad elegida (`LocationBar` en variante compacta dentro de
`<Suspense>` con su esqueleto, porque lee la cookie y la ruta usa `cacheComponents`). Un Client
Component mínimo decide por `usePathname()` si muestra ese bloque: lo oculta en `/` y en rutas
que empiezan por `/buscar`, que ya tienen el buscador grande. En móvil el buscador compacto ocupa
solo una segunda fila de la cabecera y la ciudad queda en la primera, a la derecha de la marca;
`html` lleva `scroll-padding-top: 6rem` para que la cabecera fija no tape el foco. El e2e que busca por `getByRole("searchbox", { name: "Buscar
productos" })` corre en `/` y `/buscar`, donde sigue habiendo uno solo.

## 6. Íconos y reemplazo de imagen

- Importación nominal desde `lucide-react`, tamaño por clase (`size-4`, `size-5`), `aria-hidden`
  explícito en todo ícono decorativo. Usos: buscador (`Search`), ubicación (`MapPin`), contacto
  (`MessageCircle` WhatsApp, `Phone` llamar, `Navigation` ruta), tienda (`Store`).
- `categoryIcon(category)` en `features/search/categoryIcon.ts` toma la raíz
  (`category.parent_slug ?? category.slug`) y devuelve el componente del mapa, con `Package` para
  `null` o una raíz sin mapeo. Mapa con las raíces de posveapi
  (`posveapi/docs/specs/2026-09-28-marketplace-design.md` §2.4):

| Raíz | Ícono |
|---|---|
| `salud-y-medicamentos` | `Pill` |
| `cuidado-personal` | `Sparkles` |
| `bebes-y-maternidad` | `Baby` |
| `alimentos` | `ShoppingBasket` |
| `bebidas` | `CupSoda` |
| `hogar-y-limpieza` | `SprayCan` |
| `mascotas` | `PawPrint` |
| `ferreteria` | `Wrench` |
| `tecnologia` | `Smartphone` |
| `papeleria` | `Pencil` |
| `otros` | `Package` |

- Producto sin `image_url` (`ProductCard`, `FeaturedCard`, ficha de producto): cuadro
  `bg-primary-soft text-warning rounded-xl` con el ícono al centro, `aria-hidden`. Tienda sin logo
  (`StoreCard`, `StoreHeader`): sus iniciales (`storeInitials`) sobre el mismo tinte.
- Los chips de categoría del inicio (`CategoryLinks`) llevan el ícono de su raíz delante del
  nombre.
- El simulado usa las raíces reales: `mock/fixtures.ts` trae `salud-y-medicamentos`, `alimentos`,
  `bebidas` y `ferreteria` con hijas de la misma taxonomía.

## 7. Movimiento

Transiciones de `color`, `background-color`, `box-shadow` y `transform` de 150 a 200 ms con
`ease-out`; tarjeta enlazada sube 2px en hover; `Skeleton` pulsa con `animate-pulse`. Con
`motion-reduce:` se quitan la traslación, la transición y el pulso. Sin librerías de animación.

## 8. Reglas que cambian

`.claude/rules/ui.md`: la regla 4 lista los tokens de §3 (se suman `bg-surface`, `bg-glass`,
`border-glass-border`, `bg-primary-soft`, `shadow-card`, `shadow-raised`) y dice que el desenfoque
va sólo en cabecera y buscador grande; la regla 7 permite `lucide-react` como única librería de
íconos, con `aria-hidden` en lo decorativo. El resto de la regla no cambia (sin modo oscuro,
contraste AA, foco en `outline-foreground`, primitivas sin estado).

## 9. Verificación

`tsc --noEmit`, `eslint` de lo tocado, `vitest run` completo (las pruebas de componentes buscan
textos y roles, no clases), `next build` (cambian el layout y la fuente) y `playwright test` al
cerrar. Capturas en el panel del navegador de inicio, `/buscar`, producto y tienda en escritorio y
en móvil (375 px), comprobando que la cabecera fija no tapa el primer título ni el foco.

## 10. Descomposición

Un plan en `modo: ligero` (pantallas contra el simulado, sin contrato ni dinero): base (tokens,
fuente, `lucide-react`, primitivas, cabecera y `ui.md`), luego las vistas por área (búsqueda e
inicio; producto y tienda; ubicación, error y 404). La alineación del simulado con la taxonomía ya
se hizo junto con esta spec.

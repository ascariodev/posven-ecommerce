# Rediseño "E · PosVen" del ecommerce

- Fecha: 2026-10-03
- Estado: aprobado (2026-10-03)
- Repos: posven-ecommerce (los campos nuevos del contrato, §7, se commitean en posveapi por
  separado)
- Spec del rasgo: `posven/.claude/docs/specs/2026-09-26-ecommerce-hiperlocal-design.md`; lo de
  cuentas y carrito, `posven/.claude/docs/specs/2026-09-29-cuentas-y-compras-design.md`. Esta spec
  no cambia su contrato ni sus rutas: lo que necesite un campo nuevo se declara en §7
- Reemplaza en lo visual (tokens, tipografía, estilo de shadcn) a
  `2026-09-29-ecommerce-shadcn-mercado-design.md`; sus precisiones de estructura (§4 de esa spec)
  rigen hasta que la fase que rediseña cada pantalla las cambie
- Referencia visual: `docs/design/2026-10-03-rediseno/` (`web/` y `movil/`, artboards `.dc.html`
  del lienzo). Se copian en espíritu, no el markup: todo va con primitivas shadcn y tokens

## 1. Objetivo y alcance

Llevar el ecommerce a la dirección "E · PosVen": estilo limpio y redondeado (tarjetas blancas,
imágenes sobre un mosaico gris, píldoras) con la paleta de posveapi
(`resources/js/plugins/vuetify.ts`) ajustada a AA, y modo oscuro por tokens. Se quita la capa
"estilo Farmatodo" que hoy tiene la portada y los colores literales.

Entra: base visual (F0) y el rediseño de todas las pantallas del mapa (§5), por fases (§6).
Queda afuera: el backoffice de posveapi, el cálculo de montos (el frontend sigue sin calcular;
totales por tienda y total general vienen de la API) y todo campo del contrato no declarado en §7.

## 2. Decisiones

| Tema | Decisión |
|---|---|
| Dirección | "E · PosVen", aprobada en el lienzo "PosVen ecommerce · Propuestas de rediseño" |
| Librería | shadcn/ui estilo `radix-luma` en lugar de `radix-nova` (mismo Radix, misma API). Las 12 primitivas de `components/ui/` se reinstalan con `shadcn add --overwrite` y se les reaplican las reglas de `.claude/rules/ui.md` (§4) |
| Paleta | La de posveapi con ajustes AA (§3), en las variables CSS de `app/globals.css`; ningún componente lleva un color literal |
| Tipografía | Poppins (títulos y precios) y Public Sans (interfaz y texto) por `next/font/google`; reemplazan a Outfit e Inter |
| Modo oscuro | Por clase `.dark` en `<html>`. F0 define todos los tokens en claro y oscuro y los muestra en `/preview`; el selector para el usuario llega en F4 |
| Íconos | `lucide-react` por nombre, como hoy |
| Móvil | Barra inferior de navegación (Inicio, Buscar, Favoritos, Carrito, Cuenta), en F1; los destinos quedan por confirmar (§8) |
| Limpieza | F0 quita de `app/page.tsx` la capa Farmatodo (héroe amarillo con imagen, tarjetas de valor, banner promocional) y sus imágenes de `public/`, y todos los literales de color (`bg-white`, `slate-*`, `black/*`, `--brand-navy`, `themeColor` índigo) |
| Eventos | Los eventos de búsqueda y agregado al carrito van en un plan propio entre F0 y F1 (cambian el contrato, §7) |
| Prueba previa | `/preview` desechable con tokens, tipografía y primitivas, puerta de cierre de F0; se retira al cerrar F4 (§9) |

## 3. Tokens

Nombres en el estilo de shadcn. `--accent` y `--secondary` conservan su uso de shadcn (fondo al
pasar el cursor y superficie neutra), por eso el naranja como texto es `--primary-text`. Todo
token tiene valor en `:root` y en `.dark`; su `--color-*` va en `@theme inline`.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--background` | `#fafafb` | `#1c1d20` | Fondo de página |
| `--foreground` | `#212121` | `#f5f5f5` | Texto |
| `--card` / `--popover` | `#ffffff` | `#28292d` | Tarjetas, cabecera, hojas, menús |
| `--card-foreground` / `--popover-foreground` | `= --foreground` | `= --foreground` | Texto sobre tarjeta |
| `--primary` | `#ff9d1a` | `#ff9d1a` | Acción principal, chip seleccionado, insignia |
| `--primary-foreground` | `#28292d` | `#28292d` | Texto sobre naranja (7:1; el blanco da 2,1:1) |
| `--primary-text` (nuevo) | `#a85600` | `#ffb54d` | Naranja como texto: precios, enlaces, pestaña activa |
| `--primary-soft` | `#fff3e0` | `#3a2c17` | Fondos suaves, chip activo de filtro, avatar, "Destacado" |
| `--secondary` / `--accent` | `= --muted` | `= --muted` | Uso de shadcn |
| `--secondary-foreground` / `--accent-foreground` | `= --foreground` | `= --foreground` | Uso de shadcn |
| `--ink` / `--ink-foreground` (nuevo) | `#28292d` / `#ffffff` | `#f5f5f5` / `#28292d` | Bandas carbón ("retira hoy", contacto, comercios) |
| `--buy-deep` / `--buy-deep-foreground` (nuevo) | `#28292d` / `#ffffff` | `#fa602e` / `#28292d` | Segmento derecho de la barra de compra de la ficha móvil |
| `--muted` | `#f5f5f5` | `#323338` | Campos, superficies elevadas |
| `--muted-foreground` | `#707075` | `#a1a1a5` | Texto secundario (el `#8c8c8c` de posveapi da 3,4:1) |
| `--border` | `#e6ebf1` | `#3a3b40` | Tarjetas y separadores |
| `--input-border` / `--input` | `#a1a1a5` | `#6b6b70` | Borde de controles de formulario |
| `--ring` | `= --foreground` | `= --foreground` | Anillo de foco de luma, alineado con el outline (§4) |
| `--success` / `--success-soft` (nuevo) | `#2f7d0c` / `#eafcd4` | `#95de64` / `#1f2e14` | Disponible, abierto, mejor precio, sin costo |
| `--warning` / `--warning-soft` | `#7a4a00` / `#fff6d0` | `#ffd666` / `#3a2f12` | Pocas unidades, cierra pronto, preparando |
| `--destructive` | `#ff4d4f` | `#ff7875` | Fondos y bordes de error, outline de `aria-invalid` |
| `--destructive-text` (nuevo) | `#c4262e` | `#ff7875` | Texto de error y "Cerrar sesión" (el `#ff4d4f` no llega a 4,5:1 sobre blanco) |
| `--tile` / `--tile-foreground` (nuevo) | `#f2f2f4` / `#8c8c8c` | `#323338` / `#8c8c90` | Fondo de imagen de producto y su ícono de reemplazo |
| `--glass` / `--glass-border` | `--card` y `--border` al 95 % y 80 % | ídem | Cabecera con desenfoque, hasta que F1 la rediseñe |
| `--overlay` | negro al 40 % | negro al 60 % | Fondo de `Sheet` y diálogos |
| `--elevation-card` / `--elevation-raised` | sombras suaves actuales | más opacas | `shadow-card`, `shadow-raised` |

Se retiran, con sus usos migrados en F0: `--brand-navy*` (sin usos), `--primary-hover` (luma pasa
el hover por opacidad), `--best*` (pasa a `--success*`), `--featured` (pasa a `--primary-soft`),
`--surface` (pasa a `--card`), `--warning-foreground` (el nuevo `--warning` ya es texto) y
`--tint-1..4` (el avatar pasa a `--primary-soft`/`--primary-text`).

**Radios.** Escala explícita en `@theme inline`, sin derivarla de `--radius`, con los valores del
lienzo: `rounded-lg` 12 px (controles), `rounded-xl` 14 px (imágenes y filas), `rounded-2xl` 20 px
(tarjetas), `rounded-3xl` 24 px (tarjetas grandes y hojas), `rounded-4xl` 28 px (bandas),
`rounded-full` (chips, estados, insignias). `--radius` queda en 12 px para lo que shadcn derive.

**Tipografía.**

| Rol | Fuente | Peso | Móvil / escritorio |
|---|---|---|---|
| Título de página | Poppins (`font-heading`) | 600 | 24 / 30–40 px |
| Título de sección | Poppins | 600 | 17 / 22 px |
| Precio principal | Poppins, `tabular-nums` | 600 | 26 / 36 px |
| Botón y chip | Public Sans (`font-sans`) | 600 | 14 / 15 px |
| Texto | Public Sans | 400 | 16 / 15 px |
| Dato secundario (Bs, distancia, fecha) | Public Sans | 500 | 12 / 13 px |

Poppins no es variable: se cargan los pesos 500, 600 y 700. Public Sans es variable. Texto de
campos a 16 px en móvil (iOS no hace zoom). Títulos en tipo oración.

`themeColor` del `viewport` pasa a `#ffffff` (el `--card` claro, color de la cabecera); F4 le suma
la variante oscura por `media` al activar el selector. Es el único hex fuera de `globals.css`.

## 4. Cambios a `.claude/rules/ui.md`

Se reescribe en F0, sin renumerar sus ítems:

- **Cabecera de la regla:** estilo `radix-luma` y la lista de las 12 primitivas instaladas.
- **Ítem 1:** sin cambio de fondo; la lista de interactivas sigue siendo la de hoy.
- **Ítem 4 (colores):** la lista de clases permitidas pasa a los tokens de §3 (`text-primary-text`,
  `bg-success-soft`, `text-success`, `bg-warning-soft`, `text-warning`, `text-destructive-text`,
  `bg-ink`, `bg-buy-deep`, `bg-tile`...); salen `best`, `featured`, `surface`, `tint-N` y
  `primary-hover`. "No hay modo oscuro" pasa a: modo oscuro por `.dark`; un token nuevo entra en
  `:root` y en `.dark`; un componente no usa `dark:` salvo lo que shadcn trae de serie. Los radios
  pasan a la escala explícita de §3. El desenfoque sigue sólo en la cabecera.
- **Ítem 5 (contraste):** el naranja nunca es color de texto (`text-primary` prohibido; se usa
  `text-primary-text`), el texto de error usa `text-destructive-text`, y se revisa AA en claro y
  en oscuro. Se mantienen el outline de foco en `outline-foreground` (luma trae `ring` y `border`
  de foco: el outline sigue mandando), `outline-destructive` con `aria-invalid`,
  `border-input-border` en controles y la pareja `h-11 md:h-9` del tamaño `sm`. Se suma: campos con
  `text-base` en móvil.
- **Ítem nuevo 8 (tipografía):** `font-heading` sólo en títulos y precios, precios con
  `tabular-nums`; el resto hereda `font-sans`.

## 5. Mapa pantalla → ruta

En escritorio los filtros viven en la columna izquierda de Resultados (`P14`); en móvil, en una
hoja (`P04`).

| Web | Móvil | Pantalla | Ruta o componente | Fase |
|---|---|---|---|---|
| `W01` | `P01` | Inicio | `app/page.tsx`, cabecera en `app/layout.tsx` | F1 |
| `W02` | `P02` | Búsqueda con sugerencias | `HeaderSearchSlot`, `SearchPill` (panel de sugerencias nuevo) | F1 |
| `P14` | `P03`, `P04` | Resultados y filtros | `app/buscar`, `SearchResults`, `FiltersSheet`, `RadiusFilter` | F1 |
| `W05` | `P05` | Sin resultados | `features/search/components/EmptyState.tsx` | F1 |
| `P15` | `P06` | Ficha de producto | `app/p/[slug]`, `features/product/*` | F2 |
| `W07` | `P07` | Tienda | `app/tienda/[slug]`, `features/store/*` | F2 |
| `W08` | `P08` | Carrito | `app/carrito`, `features/cart/*` | F3 |
| `W09` | `P09` | Checkout, paso 1 | `app/checkout`, `features/checkout/*` | F3 |
| `W10` | `P10` | Pedido confirmado y seguimiento | `app/checkout/resultado`, `app/cuenta/compras/[codigo]` | F3 |
| `W11` | `P11` | Cuenta | `app/cuenta/*`, `features/account/*` | F4 |
| `W12` | `P12` | Centro de ayuda | `app/ayuda` (nueva) | F4 |
| `P13` | — | Vende con posven | `app/vende` (nueva) | F4 |

Las rutas nuevas (`/ayuda`, `/vende`) se crean con la skill `new-page` (metadatos, sitemap, e2e).

## 6. Descomposición en planes

Cada fase es un plan propio en `docs/plans/`, con sus pruebas y su puerta de cierre. F0 va
primero; F1 a F4 pueden reordenarse si el negocio lo pide, salvo F3, que necesita F2.

| Plan | Alcance | Puerta de cierre |
|---|---|---|
| F0 · Base visual | `radix-luma` y reinstalación de las 12 primitivas; tokens claro y oscuro (§3); Poppins + Public Sans; limpieza de la capa Farmatodo y los literales; `ui.md` (§4); `/preview` | Tokens y primitivas aprobados en `/preview` |
| Eventos | `search` y `add_to_cart` en `/api/events` (§7.9), en spec, posveapi y ecommerce; arranca la línea base de dos semanas | e2e en verde y eventos registrados en posveapi local |
| F1 · Descubrir | Cabecera con ubicación; barra inferior; Inicio; sugerencias; listado con filtros y orden; sin resultados | e2e en verde y revisión contra el lienzo |
| F2 · Decidir | Ficha (elegir tienda en la lista, barra de compra fija, detalles plegables); tienda; directorio de comercios; nombre de tienda y contacto en `OfferCard` (§8) | e2e en verde y revisión contra el lienzo |
| F3 · Comprar | Carrito agrupado por tienda con el costo de entrega antes de pagar; checkout corto (meta 12–14 campos); resultado y seguimiento | Pago de prueba completo en modo simulado |
| F4 · Confianza y retención | Cuenta y favoritos con "volver a comprar"; ayuda; Vende con posven; vacíos, error y 404; selector de modo oscuro; retiro de `/preview`; embudo medido; alertas si llega el contrato | e2e en verde y revisión contra el lienzo |

Reinstalación de primitivas en F0, con lo aprendido en la spec anterior: `components.json` pasa a
`radix-luma` y cada primitiva se agrega sola con `--overwrite`, revisando el diff contra §3 y §4.
Se vigila que `shadcn add` no pise `lib/utils.ts` (registra `shadow-card` y `shadow-raised` en
`cn`) ni `app/globals.css`, y que se conserven la pila `motion-reduce` de L-03 en `sheet`,
`select` y `dropdown-menu`, el `type="button"` por defecto de `Button` y `Toggle` sin
`'use client'`. luma trae botones en píldora (`rounded-4xl`): el lienzo los quiere en 12 px
(`rounded-lg`), y las píldoras quedan para chips.

## 7. Fuera de alcance y dependencias del contrato

Cada campo entra primero en la spec del rasgo §3 (o en la §4 de cuentas y compras si es del
carrito), después en posveapi y al final en `lib/marketplace/schemas.ts` y en el simulado. Estado
contra el contrato actual:

1. **`sort` en `/search`** (precio o cercanía). Hecho: `searchQuery` envía `sort` (`OfferSort`) y el simulado ordena por precio mínimo, o por cercanía con ubicación. Sin `sort` el orden es el de siempre. Las pantallas lo usan en F1b.
2. **Productos para el inicio.** Hecho: `GET /products/nearby` de posveapi responde `{ data, meta, rate }` (sin `featured`, ítems con la forma de uno de `/search`, con la ubicación de `/search` y `page`; sin ubicación ordena por precio). `listNearbyProducts` del cliente la pide y el simulado la imita. Ya no hay `FeaturedProducts`: el inicio de F1b usa `listNearbyProducts`.
3. **Sugerencias de búsqueda.** Hecho: `GET /suggestions` de posveapi responde `{ terms, products,
   categories, rate }` (hasta 5 términos, 4 productos con la forma de un ítem de `/search` y 2
   categorías `{ slug, name }`; 422 con `q` de menos de 2 caracteres, misma ubicación que
   `/search`). `getSuggestions` del cliente la pide, y el navegador la alcanza por el route handler
   `GET /api/suggestions?q&radio`, que lee la ubicación de la cookie, responde listas vacías con `q`
   corto sin llamar a la API y 503 con listas vacías si la API cae. El debounce va en el panel (F1b).
4. **Abierto ahora y "Cierra pronto".** Hecho: `offerSchema` (búsqueda y ficha) y `nearbyStoreSchema` traen `is_open` y `closes_at` (HH:MM, nulo sin tramo vigente ni próximo hoy), opcionales para el consumidor y calculados por la API (el simulado los saca de `MOCK_STORE_DETAILS`); `searchQuery` envía `open_now=true` para el filtro "abierto ahora" de `/search`. El aviso "Cierra pronto" se define en F1b a partir de `closes_at`, sin calcular horarios en el frontend.
5. **`cover_url` en las tiendas cercanas.** Hecho: `GET /stores` de posveapi lo trae en cada tienda (URL o nulo; sólo premium con portada) y `nearbyStoreSchema` lo declara opcional; el simulado lo saca de `MOCK_STORE_DETAILS`.
6. **`is_best_price` en `productOfferSchema`.** Hecho: la API lo marca en la oferta de menor `price_usd` entre las destacadas y las de dentro del radio (empates, todas; `outside_radius` nunca) y `productOfferSchema` lo declara opcional; el simulado lo calcula igual. Los componentes que hoy deducen "Mejor precio" por posición lo adoptan en F2b.
7. **Costo de entrega en el carrito.** Hecho: `GET /me/cart` y `POST /cart/quote` aceptan la elección de entrega por tienda y `cartStoreSchema` trae `fulfillment`, `delivery_fee_usd`, `delivery_fee_ves`, `total_usd` y `total_ves` (opcionales para el consumidor, calculados por la API; sin elección todo es retiro y el total es el subtotal). El carrito no valida el radio: eso sigue en el checkout. El simulado devuelve retiro con la tarifa de la tienda. Las pantallas de F3b lo usan.
8. **Alertas de precio y disponibilidad.** Falta todo (endpoint y cuenta). F4.
9. **Eventos `search` y `add_to_cart`.** `eventTypeSchema` sólo tiene vistas y clics de contacto.
   Plan propio entre F0 y F1 (§6).

"Disponible en N tiendas" no pide campo: `offers_count` ya viene en cada resultado.

## 8. Decisiones abiertas

- Destinos de la barra inferior en móvil (F1).
- Aprobar `vaul` (drawer) y `embla-carousel` (carrusel) o quedarse sólo con `sheet` (F1 y F2).
- Compra como invitado: queda fuera de F3 (el checkout exige cuenta); se decide en un plan posterior.
- Qué campos de §7 pide posveapi primero.
- Nombre de la tienda y contacto en `OfferCard`: el cambio que muestra "Comercio Aliado" y quitó
  `ContactButtons` se consulta con su autor antes de F2; F0 sólo le cambia tokens.
- Respuestas de las preguntas frecuentes de "Vende con posven" y el supuesto de que el comercio
  activa y mide su tienda desde su panel (F4).
- Logo y nombre de la marca: siguen por `SITE_NAME`; no los fija esta spec.

## 9. Ruta de prueba desechable

`app/preview/page.tsx` muestra, sin leer la API, los tokens de §3 en claro y en oscuro lado a lado
(un contenedor con `.dark`), la escala tipográfica y las 12 primitivas en sus variantes y
tamaños. Exporta `robots: { index: false, follow: false }`, no entra al sitemap, `app/robots.ts`
la excluye y nada la enlaza. F4 la retira al activar el selector de modo oscuro.

# shadcn/ui y dirección "Mercado" del ecommerce

- Fecha: 2026-09-29
- Estado: aprobado
- Repos: posven-ecommerce
- Spec del rasgo: `posven/.claude/docs/specs/2026-09-26-ecommerce-hiperlocal-design.md` (esta spec
  no cambia su contrato §3 ni sus rutas; lo que necesite un campo nuevo se declara en §7)
- Reemplaza en lo visual a `2026-09-28-visual-moderna-design.md` (tokens y primitivas)

## 1. Objetivo y alcance

Dar al ecommerce una identidad más moderna y sencilla, tomando como referencia Airbnb (explorar)
y Trivago (comparar), con shadcn/ui como base de componentes. La estructura de datos, las rutas,
los metadatos y el contrato con posveapi no cambian.

Entra: inicio, `/buscar`, `/p/[slug]`, y la migración de todas las pantallas que hoy usan las
primitivas (`/tienda`, cuenta, formularios, error y 404). Queda afuera: modo oscuro, el backoffice
de posveapi y cualquier campo nuevo del contrato (§7).

## 2. Decisiones

| Tema | Decisión |
|---|---|
| Dirección visual | C "Mercado": para explorar, píldora de búsqueda, carril de categorías y tarjetas con imagen; para decidir, la ficha con el resumen y las tiendas ordenadas por precio |
| Librería | shadcn/ui estilo `radix-nova`, ya instalada (`components.json`, `lib/utils.ts`) |
| Primitivas propias | Se reemplazan por las de shadcn (`badge`, `button`, `card`, `input`, `skeleton`) y se eliminan `components/ui/cx.ts` y las funciones `buttonClasses` e `inputSize` |
| Paleta | Se define en las variables CSS de `app/globals.css`, que es la configuración de tema de shadcn; ningún componente lleva un color literal |
| Íconos | `lucide-react`, como hoy |
| Modo oscuro | Fuera; `@custom-variant dark` queda declarado para que las clases `dark:` de shadcn no reaccionen al sistema |
| Tipografía | Plus Jakarta Sans por `next/font/google`, como hoy (no Geist) |
| Cabecera | Fija con vidrio y desenfoque, como hoy |
| Radio | `--radius` de 1 rem |
| Prueba previa | Una ruta `/preview` con la dirección C y datos reales, desechable, antes de migrar (§9) |

## 3. Tema

`app/globals.css` conserva la paleta de marca (`--primary` `#f7900a`, `--background` `#fffaf3`,
`--foreground` `#262627`) y mapea a ella los tokens de shadcn: `--card`, `--popover`,
`--secondary`, `--accent`, `--destructive`, `--input`, `--ring` y `--radius` (1 rem). Mientras
no se migre, la escala de radios de Tailwind no se sobrescribe, porque las páginas actuales
usan `rounded-xl` y `rounded-2xl`; el plan 1 decide si adopta la escala de shadcn. Los tokens propios que no tienen equivalente en
shadcn (`--surface`, `--glass`, `--glass-border`, `--featured`, `--warning`, `--primary-soft`,
sombras) se conservan mientras alguna pantalla los use. Los cambios de valor (radio, sombra,
contraste) se hacen aquí y no en cada componente.

El botón por defecto de shadcn mide 32 px de alto. El ecommerce se usa en móvil, así que
`button.tsx` y `input.tsx` conservan una altura táctil de al menos 44 px (`size="lg"` o el
tamaño por defecto ajustado en el propio archivo). El contraste AA y el foco visible en
`--foreground` siguen rigiendo.

Precisión del plan 4 (`docs/plans/2026-09-30-shadcn-mercado-plan-4-deuda.md`): el tamaño `sm` de
`Button`, `Toggle` y `SelectTrigger` mide 44 px en móvil y 36 px desde `md` (`h-11 md:h-9`), y
las alturas escritas a mano en controles y esqueletos siguen la misma pareja.

## 4. Pantallas de la dirección C

| Pantalla | Composición | Piezas de shadcn |
|---|---|---|
| Inicio | Título, píldora de dos segmentos (qué y dónde), carril de categorías con icono, rejilla "Cerca de ti" con tarjetas de imagen, tiendas con portada | `input`, `button`, `tabs`, `card`, `badge` |
| Búsqueda | Píldora compacta, chips de categoría, botón de filtros, orden y rejilla de tarjetas con "Desde" y número de tiendas | `sheet` (filtros en móvil), `select`, `badge`, `toggle-group` |
| Ficha | Imagen a la izquierda; a la derecha un panel con el resumen del producto y su rango de precio; debajo, a todo el ancho, las tiendas en filas con "Mejor precio", Llamar y Ver ruta (precisiones del plan 3 abajo) | `card`, `badge`, `button`, `toggle` |
| Cabecera | Marca, píldora compacta de dos segmentos (qué y dónde) y cuenta; en `/` y `/buscar` sin píldora, que ya va en la página (precisiones del plan 5 abajo) | `input`, `button`, `sheet`, `select`, `dropdown-menu` |

Diferencias del plan 2 (`docs/plans/2026-09-30-shadcn-mercado-plan-2-inicio-busqueda.md`) contra
la tabla anterior, decididas al planificarlo y ya en el código:

1. **Inicio sin rejilla "Cerca de ti" de productos.** El contrato no tiene un endpoint de
   productos destacados o cercanos (la vista previa lo simulaba con `q: "a"`); se declara en §7.
2. **Búsqueda sin selector de orden.** `/search` no acepta `sort` y ordenar una página en el
   navegador mentiría sobre el conjunto; se declara en §7. `select` se usa en el selector de
   ubicación y, desde el plan 4, en la ciudad de `AddressForm`.
3. **Inicio sin `tabs`.** No se instala; el carril de categorías son enlaces a `/buscar`.
4. **Filtro de distancia con la forma de `toggle-group`, hecho de enlaces.** `RadiusFilter` usa
   `toggleVariants` por `cn` sobre `<Link>` y conserva sus URL, `aria-current` y el funcionamiento
   sin JavaScript. En móvil va dentro de un `Sheet` ("Filtros").
5. **Escala de radios de shadcn** derivada de `--radius` (`rounded-md`, `rounded-lg`...); las
   pantallas pasan a esa escala.
6. **Tarjeta de tienda con banda de color por token** y el logo o las iniciales encima; la portada
   real exige `cover_url` en las tiendas cercanas, que se declara en §7.

Precisiones del plan 3 (`docs/plans/2026-09-30-shadcn-mercado-plan-3-ficha.md`) sobre la ficha,
decididas al planificarlo y ya en el código:

1. **Panel sólo con el resumen.** Imagen a la izquierda; a la derecha el resumen (categoría,
   nombre, marca, récipe, rango de precio, favoritos, atributos). La lista completa de tiendas va
   debajo, a todo el ancho, con el orden, las destacadas y "Fuera de tu zona". En móvil todo se
   apila. El plan 4 le quitó el `sticky` que tenía en escritorio: con la lista debajo, el panel
   sólo podía moverse dentro de la fila de la imagen y apenas se desplazaba.
2. **"Mejor precio" sólo con orden por precio, en la primera oferta normal y sin destacadas** (la
   primera de `offers` dentro del radio). La API saca las destacadas de `offers` y una puede ser
   más barata, así que con destacadas no se marca ninguna (revisión final del plan 3). Ni las
   destacadas ni la vista "Más cerca" la llevan. El frontend no compara precios: la marca sale
   del orden de la API; marcar siempre exigiría un campo como `is_best_price` en el contrato.
3. **Rango del panel sólo en dólares**, de `offers_summary`: "Desde $X", "hasta $Y" cuando la
   cadena del máximo es distinta de la del mínimo, "en N tiendas" y "Precio en todo el país". Los
   bolívares aparecen en cada tienda de la lista.
4. **Migas de pan con las categorías como texto.** Sólo "Inicio" es enlace; `/categoria/<slug>`
   no existe (hoy da 404). El JSON-LD `BreadcrumbList` lleva sólo Inicio y el producto.

Precisiones del plan 5 (`docs/plans/2026-09-30-shadcn-mercado-plan-5-cabecera.md`) sobre la
cabecera, decididas al planificarlo y ya en el código:

1. **Píldora compacta en ficha, tienda y cuenta.** `SearchPill compact` con "qué", "dónde" (abre
   `LocationSheet`) y "Buscar"; reemplaza al buscador compacto anterior y al texto "Cerca de: …".
   Como vive en el layout raíz, fuera de `app/error.tsx`, su segmento "dónde" no se pinta si la
   API cae (L-02); en `/` y `/buscar` la píldora de la página conserva su comportamiento.
2. **Menú de cuenta con `dropdown-menu`.** "Mi cuenta" abre un menú con Resumen, Perfil,
   Direcciones, Favoritos, Configuración y Salir; se cierra con Escape y clic fuera y se recorre
   con las flechas. Sin JavaScript el menú no abre (se acepta, como la hoja de ubicación).
3. **Dos filas en móvil.** Marca y cuenta arriba; la píldora abajo, a todo el ancho. Desde `sm`,
   una fila: marca, píldora centrada con ancho máximo y cuenta. La cabecera conserva el vidrio, el
   desenfoque y la sombra al hacer scroll.

Sin imagen, una tarjeta muestra el icono de su categoría raíz sobre un tinte por categoría (el
comportamiento actual de `ProductThumb`, con los tintes del prototipo). "Mejor precio" marca la
oferta de menor precio de la ficha (precisión 2 arriba); el frontend no calcula montos, usa el
orden y los importes que entrega la API.

## 5. Estrategia de migración

Las primitivas actuales las usan 42 archivos (88 usos). El reemplazo va primero y por sí solo,
para que el resto del trabajo parta de la librería:

1. `npx shadcn add badge button card input skeleton --overwrite` (una a una, revisando el diff
   contra los tokens de §3) y migración de los usos: `primary` a `default`, `secondary` a
   `outline`, `ghost` igual, `md` al tamaño por defecto y `sm` a `sm`; un enlace con forma de
   botón usa `buttonVariants` sobre `<Link>`.
2. Lo que ya se ve bien no cambia de aspecto en esa tarea: es una migración de API, no un
   rediseño. La verificación es `tsc`, `vitest`, `next build` y `playwright`.

## 6. Descomposición en planes

Modo ligero (pantallas contra un simulado y datos locales), un solo repo. Razones de corte:

| Plan | Contenido | Razón de corte | Tamaño |
|---|---|---|---|
| 1 | Reemplazo de primitivas y migración de usos (§5) | Mecánico, diff que se revisa aparte | ~42 archivos, advertencia de tamaño |
| 2 | Inicio y búsqueda en dirección C (§4) | Depende de 1; juicio visual | ~10 archivos |
| 3 | Ficha en dirección C (§4). **Cerrado** (2026-09-30) | Otra pantalla; se puede revisar sola | ~5 archivos |
| 4 | Deuda menor de los planes 2 y 3: primitivas, `sm` táctil, ficha y `AddressForm` con `Select`. **Cerrado** (2026-09-30) | Arreglos repartidos que no cambian pantallas | ~25 archivos |
| 5 | Cabecera en dirección C: píldora compacta y menú de cuenta. **Cerrado** (2026-09-30) | Pieza común a todas las pantallas; se revisa sola | ~22 archivos |

El plan 1 se parte en dos tareas por área (cuenta y formularios frente a búsqueda, producto y
tienda) si el diff no se revisa en una pasada. Antes de ejecutar 2 y 3 se instalan solo las piezas
nuevas que cada uno use (`carousel` queda para §7).

## 7. Fuera de alcance y dependencias del contrato

- **Rango "desde / hasta".** La ficha lo tiene: `offers_summary.low_price_usd` y
  `high_price_usd` (`lib/marketplace/schemas.ts`). La búsqueda solo entrega `offers_count`,
  `min_price_usd` y `min_price_ves`, así que la tarjeta muestra "Desde" y nada más; un máximo en
  la tarjeta exige un campo nuevo en la spec §3 y en posveapi.
- **Galería y carrusel.** El contrato entrega una sola `image_url` por producto. Varias imágenes
  exigen un campo nuevo en spec y en posveapi; hasta entonces la ficha lleva una imagen y no se
  instala `carousel`.
- **Productos destacados o cercanos para el inicio.** El contrato no tiene un endpoint que
  entregue productos para la portada, así que el inicio no muestra la rejilla "Cerca de ti" de la
  dirección C. Exige un endpoint nuevo en la spec §3 y en posveapi.
- **Orden de la búsqueda.** `/search` no acepta `sort` (`searchQuery` en
  `lib/marketplace/params.ts`), así que `/buscar` no tiene selector de orden. Exige un parámetro
  nuevo en la spec §3 y en posveapi.
- **Portada de las tiendas cercanas.** `NearbyStore` no trae `cover_url`; la tarjeta de tienda usa
  una banda de color por token en lugar de la portada. Exige el campo en la spec §3 y en posveapi.
- **Deuda observada en el entorno local** (no la resuelve esta spec): `/categories` de posveapi
  local devuelve vacío y los productos vienen sin categoría, así que el carril de categorías queda
  sin datos; la imagen de la ficha se ve rota porque el archivo no existe en el `storage` del
  contenedor local (posveapi responde 404 a esa URL). `next build` y el modo `standalone` con las
  dependencias nuevas se probaron en los planes 1 y 2.
- **Regla `.claude/rules/ui.md`.** Sus ítems 1 (primitivas sin estado ni `'use client'`), 3 (`cx`)
  y 7 (sin shadcn ni Radix) dejaron de regir; se reescribió al cerrar el plan 1 y se amplió en el
  plan 2.

## 8. Decisiones abiertas

Ninguna: la tipografía, la cabecera, el radio y la ruta de prueba se cerraron y están en §2. La
spec fue aprobada por quien coordina el 2026-09-29 tras ver `/preview`.

## 9. Ruta de prueba desechable

Retirada en el plan 2. `app/preview/` montaba la dirección C (inicio, búsqueda y ficha en pestañas)
con los datos reales de posveapi, y sus piezas de shadcn vivían en `components/preview-ui/`. Al
pasar el inicio y la búsqueda a `components/ui/` y a las pantallas reales, ambas carpetas se
borraron; nada las importa. La ficha se rediseña en el plan 3 sin ruta de prueba.

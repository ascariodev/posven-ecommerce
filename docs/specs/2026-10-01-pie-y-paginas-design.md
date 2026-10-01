# Pie del sitio y páginas de comercios y legales

- Fecha: 2026-10-01
- Estado: aprobado (2026-10-01)
- Repos: `posven-ecommerce` (código); `posven/.claude` (enmienda de la spec hiperlocal, §6)
- Base visual: dirección C de `docs/specs/2026-09-29-ecommerce-shadcn-mercado-design.md`

## 1. Objetivo y decisiones del usuario

Hoy el pie (`app/layout.tsx`) es una fila con tres enlaces que dan 404: `/comercios`,
`/terminos` y `/privacidad`. Esta spec diseña el pie en dirección C y esas tres páginas.

Decisiones del usuario (2026-10-01):

- **Legales como borrador.** `/terminos` y `/privacidad` salen con un texto completo en
  estructura, con marcadores entre corchetes donde va un dato de la empresa, un aviso visible de
  borrador, `noindex` y fuera del sitemap hasta que el área legal lo apruebe (§4).
- **`/comercios` informativa con contacto**, sin backend: explica cómo aparecer en el buscador y
  ofrece WhatsApp y correo (§3).
- **Contacto por variables de entorno**: `MERCHANT_WHATSAPP` y `MERCHANT_EMAIL`; cada botón se
  pinta sólo si su variable está puesta. Nada inventado en el repo.
- **Pie en columnas** (§2), apilado en móvil.

## 2. El pie

Componente de servidor `SiteFooter` en `features/site/`, que `app/layout.tsx` monta en lugar del
`<footer>` actual. Fondo `bg-surface`, `border-t`, ancho `max-w-5xl` como la cabecera.

| Columna | Contenido |
|---|---|
| Marca | `SITE_NAME` con el mismo estilo de texto que la cabecera y `SITE_DESCRIPTION` debajo |
| Categorías | hasta 8 categorías raíz de `listCategories()`, en el orden de la API, cada una a `searchHref({ q: "", categoria, radio: DEFAULT_RADIUS_KM, pagina: 1 })` |
| Comercios | "Para comercios" a `/comercios` |
| Legal | "Términos" a `/terminos` y "Privacidad" a `/privacidad` |

Línea final: `© <año> SITE_NAME`.

- **Disposición**: una columna en móvil; dos desde `sm`; la marca ocupa su fila y las otras tres
  van en fila desde `lg`. Cada columna lleva un título (`h2` visualmente chico) y una lista de
  enlaces dentro de un `<nav aria-label>` propio.
- **Táctil**: en móvil cada enlace mide al menos 44 px de alto, como los controles `sm` del plan 4.
- **Categorías desde el layout**: `listCategories()` es `'use cache'` y se lee en el layout, así
  que el pie atrapa `MarketplaceUnavailableError` y omite la columna (lección L-02, regla
  `app-router` 7). Sin categorías raíz, la columna también se omite.
- **El año**: `new Date()` en un prerender exige caché o `connection()` (guía `08-caching.md`,
  "Random values and timestamps"); va en una función `'use cache'` con `cacheLife("days")`, sin
  `connection()`, para no volver dinámico el layout.

## 3. `/comercios`

Página indexable de servidor, sin lecturas de la API. Su público es el dueño de una tienda; el
producto que se vende es el punto de venta, que no es la marca del buscador.

- **Nombre del punto de venta**: constante nueva `POS_NAME = "posven"` en `lib/site.ts`, porque
  `SITE_NAME` puede cambiar (el nombre del buscador está en consulta) y la regla `app-router` 8
  prohíbe la marca literal en texto visible.
- **Bloques**, en este orden: encabezado con la propuesta (los productos de la tienda aparecen a
  quien busca cerca, con precio en dólares y bolívares); tres pasos (la tienda usa `POS_NAME` en
  su caja, publica su catálogo desde la pestaña eCommerce del backoffice, los clientes la
  encuentran y le escriben o compran); bloque de contacto.
- **Contacto**: botón de WhatsApp a `https://wa.me/<dígitos de MERCHANT_WHATSAPP>` con el mensaje
  "Hola, quiero que mi comercio aparezca en SITE_NAME"; enlace `mailto:` a `MERCHANT_EMAIL`. Sin
  ninguna de las dos variables, el bloque de contacto no se pinta. La página se prerenderiza, así
  que las variables se leen al construir: cambiarlas exige un build nuevo. Se agregan, vacías y
  comentadas, a `.env.example`.
- **SEO**: `metadata` estática con título "Para comercios", descripción propia y
  `alternates: { canonical: "/comercios" }`; entra al grupo `static` de `lib/sitemap.ts`. Sin
  JSON-LD: no hay entidad que describir hasta tener razón social.
- **Eventos**: los clics de contacto no se registran; `POST /api/events` exige `store_slug` y
  esto no es una tienda.

## 4. `/terminos` y `/privacidad`

Dos páginas de servidor con texto en TSX (sin dependencias nuevas de Markdown ni de tipografía),
estilos de prosa propios del módulo.

- **Interruptor único**: `LEGAL_DRAFT = true` en `features/site/lib/legal.ts`. Mientras es `true`:
  aviso visible arriba de cada página ("Borrador pendiente de revisión legal"),
  `robots: { index: false, follow: true }` y ninguna de las dos entra al sitemap. Pasarlo a
  `false` las vuelve indexables (canónica propia) y las suma al grupo `static`.
- **Marcadores**: `[RAZÓN SOCIAL]`, `[RIF]`, `[DOMICILIO]`, `[CORREO LEGAL]` y
  `[FECHA DE VIGENCIA]`, y ningún otro. Una prueba unitaria falla si `LEGAL_DRAFT` es `false` y
  queda un marcador en el texto, para que la aprobación no publique corchetes.
- **Términos**, por secciones: qué es el sitio (buscador que muestra ofertas de comercios
  independientes y permite comprarles); cuentas; precios en dólares y bolívares y la tasa usada;
  compras (el contrato es entre comprador y comercio, el retiro con código y los reembolsos);
  conducta prohibida; responsabilidad; propiedad intelectual; ley aplicable (República Bolivariana
  de Venezuela); contacto y vigencia.
- **Privacidad**, por secciones: responsable (`[RAZÓN SOCIAL]`, `[RIF]`, `[DOMICILIO]`); datos
  que se tratan, según lo que el sitio guarda hoy: cuenta (nombre, correo, teléfono), direcciones
  (destinatario, teléfono, dirección y coordenadas), ubicación elegida para buscar, compras,
  preferencias de correo y eventos de vista y de contacto; cookies (`mp_session`, `mp_cart`,
  `loc` y `sid`, cada una con su fin); finalidades; qué recibe el comercio de una compra;
  conservación; derechos de acceso, rectificación y supresión; contacto y vigencia.
- El texto lo redacta quien implementa a partir de esta lista; no se afirma nada que el sitio no
  haga (sin publicidad de terceros ni analítica externa, porque no las hay).

## 5. Módulo y verificación

- **Módulo** `features/site/` con README según la plantilla del repo: `SiteFooter`, el contenido
  de `/comercios`, los textos legales y `LEGAL_DRAFT`. Rutas `app/comercios/page.tsx`,
  `app/terminos/page.tsx` y `app/privacidad/page.tsx`, creadas con la skill `new-page`.
- **Pruebas unitarias**: el pie omite la columna de categorías si la API falla o no hay raíces y
  corta en 8; el bloque de contacto sigue las variables; la guarda de marcadores de §4.
- **e2e**: los tres enlaces del pie responden 200; canónica de `/comercios`; `noindex` de
  `/terminos` y `/privacidad` mientras son borrador; `/comercios` en el sitemap y las legales
  fuera. El caso de `e2e/search.spec.ts` que busca `a[href="/comercios"]` sigue valiendo.
- **Revisión visual** del pie en móvil y escritorio, y de las tres páginas.

## 6. Enmiendas a otras specs

- `posven/.claude/docs/specs/2026-09-26-ecommerce-hiperlocal-design.md` §4.1: `/terminos` y
  `/privacidad` son indexables una vez aprobado su texto; mientras sean borrador, `noindex` y
  fuera del sitemap (esta spec, §4). §9, plan D: `/comercios` y legales pasan a esta spec. Aplicadas.

## 7. Fuera de alcance

- Texto legal definitivo y los datos de la empresa: los pone el área legal al aprobar.
- Formulario de solicitud de comercios o captación en posveapi.
- `/categoria/[slug]`: cuando exista (plan D), el pie enlaza ahí en vez de a `/buscar`.
- Logo en el pie: espera el nombre y el logo finales; hoy va `SITE_NAME` en texto, como la
  cabecera.
- Redes sociales en el pie: no hay cuentas definidas.

## 8. Descomposición

Un plan, modo ligero (pantallas sin contrato nuevo, un repo), en el orden pie, `/comercios`,
legales; cada parte se revisa sola.

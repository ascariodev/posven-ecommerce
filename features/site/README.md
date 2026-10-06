---
module: "site"
path: "features/site"
type: "feature"
exports: ["SiteHeader", "MobileNav", "MobileNavSkeleton", "MobileNavLinks", "SiteFooter", "FooterCategories", "footerYear", "MerchantContact", "merchantContactHref", "ThemeProvider", "ThemeSwitch", "LegalDocument", "LEGAL_DRAFT", "LEGAL_MARKERS", "LEGAL_PATHS", "legalMetadata", "legalSitemapPaths", "legalText", "termsDocument", "privacyDocument", "brandIcon", "BrandIconVariant"]
depends_on: ["lib/marketplace/client.ts", "lib/marketplace/errors.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/site.ts", "features/search/lib/query.ts", "features/account/components/AccountMenu.tsx", "features/account/lib/returnPath.ts", "features/account/server/session.ts", "features/cart/components/CartLink.tsx", "features/cart/lib/flag.ts", "features/location/components/LocationBar.tsx", "features/search/components/HeaderSearchSlot.tsx", "features/search/components/SearchPill.tsx", "components/ui/button.tsx", "components/ui/switch.tsx", "lib/utils.ts", "next-themes", "next/og"]
tests: "features/site/__tests__/*.test.tsx"
verified_against: ["features/site/components/SiteHeader.tsx", "features/site/components/MobileNav.tsx", "features/site/components/MobileNavLinks.tsx", "e2e/site.spec.ts", "features/site/components/SiteFooter.tsx", "features/site/lib/year.ts", "features/site/__tests__/SiteFooter.test.tsx", "features/site/components/MerchantContact.tsx", "features/site/__tests__/MerchantContact.test.tsx", "app/ayuda/page.tsx", "app/vende/page.tsx", "features/merchants/components/MerchantsLanding.tsx", "features/help/components/HelpCenter.tsx", "lib/sitemap.ts", "next.config.ts", "app/layout.tsx", "lib/site.ts", "features/search/lib/query.ts", "lib/marketplace/client.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "features/site/lib/legal.ts", "features/site/__tests__/legal.test.tsx", "features/site/components/LegalDocument.tsx", "features/site/lib/terms.ts", "app/terminos/page.tsx", "features/site/lib/privacy.ts", "app/privacidad/page.tsx", "features/account/server/session.ts", "features/cart/server/cookie.ts", "features/cart/server/cart.ts", "features/location/lib/cookie.ts", "features/location/server/actions.ts", "app/api/events/route.ts", "features/events/lib/handle.ts", "app/globals.css", "components/ui/sonner.tsx", "features/site/components/ThemeProvider.tsx", "features/site/components/ThemeSwitch.tsx", "features/site/__tests__/ThemeSwitch.test.tsx", "docs/specs/2026-10-03-rediseno-posven-design.md", "features/site/lib/brand-icon.tsx", "features/site/assets/Poppins-Bold.ttf", "app/icon.tsx", "app/apple-icon.tsx", "app/manifest.ts"]
verified_at: "b0bed8d"
capabilities:
  - intent: "mostrar la cabecera del sitio con la ubicación visible"
    intent_aliases: ["cabecera", "header", "barra superior", "ubicacion visible", "buscar cerca de"]
    entrypoint: "<SiteHeader />"
    file: "features/site/components/SiteHeader.tsx"
    input: "sin props; se monta en app/layout.tsx antes de <main>"
    output: "cabecera pegajosa con logo, botón de ubicación (LocationBar con degrade), buscador compacto (HeaderSearchSlot lo oculta en / y /buscar), desde md, enlace a Tiendas (/tiendas), favoritos, carrito y cuenta (bajo md los reemplaza la barra inferior, que no lleva Tiendas: son cinco destinos)"
    source: "LocationBar, SearchPill, CartLink y AccountSlot"
    rules: []
  - intent: "navegar por la barra inferior en móvil"
    intent_aliases: ["barra inferior", "tab bar", "navegacion movil", "menu inferior", "bottom nav"]
    entrypoint: "<MobileNav />"
    file: "features/site/components/MobileNav.tsx"
    input: "sin props; app/layout.tsx la monta tras el pie, dentro de <Suspense fallback={<MobileNavSkeleton />}>"
    output: "nav 'Navegación principal' fija al pie, sólo bajo md, con Inicio, Buscar, Favoritos, Carrito (sólo con el carrito encendido, con contador) y Cuenta; la ruta activa lleva aria-current; sin sesión Favoritos y Cuenta apuntan a /entrar con volver"
    source: "accountContext() (cookie de sesión, sin llamar a la API) y cartCount() de CartLink"
    rules: ["RN-SITE-07"]
  - intent: "mostrar el pie del sitio con sus columnas de enlaces"
    intent_aliases: ["pie de pagina", "footer", "enlaces legales", "categorias del pie", "para comercios"]
    entrypoint: "<SiteFooter />"
    file: "features/site/components/SiteFooter.tsx"
    input: "sin props; se monta en app/layout.tsx después de <main>"
    output: "footer con columnas Marca (SITE_NAME y SITE_DESCRIPTION), Categorías (hasta 8 raíces de listCategories() hacia /buscar?categoria=<slug>), Ayuda (/ayuda), Comercios (/vende), Legal (/terminos y /privacidad) la línea '© <año> SITE_NAME' y el interruptor ThemeSwitch; sin API o sin raíces no pinta la columna de categorías"
    source: "listCategories() de lib/marketplace/client.ts y footerYear()"
    rules: ["RN-SITE-01", "RN-SITE-02"]
  - intent: "ofrecer contacto de soporte al comprador en la ayuda"
    intent_aliases: ["contacto de soporte", "banda de contacto de la ayuda", "whatsapp de soporte", "no encontraste la respuesta"]
    entrypoint: "<MerchantContact whatsapp={string | null} email={string | null} />"
    file: "features/site/components/MerchantContact.tsx"
    input: "whatsapp (dígitos) y email, cada uno string o null; las páginas los toman de merchantWhatsapp() y merchantEmail() de lib/site.ts"
    output: "bloque con botón de WhatsApp (https://wa.me/<dígitos>?text=...) y enlace mailto:, cada uno sólo con su dato; null si faltan ambos. banda sobre bg-ink '¿No encontraste la respuesta?' con el mensaje de ayuda a compradores, sin horarios"
    source: "variables de entorno MERCHANT_WHATSAPP y MERCHANT_EMAIL, leídas al construir"
    rules: ["RN-SITE-03"]
  - intent: "publicar los términos de uso como borrador legal"
    intent_aliases: ["terminos y condiciones", "terminos de uso", "texto legal", "borrador legal", "marcadores legales"]
    entrypoint: "<LegalDocument document={termsDocument} />"
    file: "features/site/components/LegalDocument.tsx"
    input: "document: LegalDocumentContent (título y secciones con párrafos y viñetas); el texto de términos es termsDocument de features/site/lib/terms.ts"
    output: "artículo con h1, una sección h2 por apartado y, mientras LEGAL_DRAFT sea true, el aviso 'Borrador pendiente de revisión legal'; la página usa legalMetadata (noindex, follow en borrador; canónica propia sin él)"
    source: "LEGAL_DRAFT y LEGAL_MARKERS de features/site/lib/legal.ts"
    rules: ["RN-SITE-04", "RN-SITE-05"]
  - intent: "publicar la política de privacidad como borrador legal"
    intent_aliases: ["privacidad", "politica de privacidad", "cookies", "proteccion de datos", "derechos del usuario"]
    entrypoint: "<LegalDocument document={privacyDocument} />"
    file: "features/site/lib/privacy.ts"
    input: "sin props; privacyDocument de features/site/lib/privacy.ts, que app/privacidad/page.tsx pasa a LegalDocument"
    output: "ocho secciones: responsable, datos, cookies (mp_session, mp_cart, loc y sid), finalidades, terceros, conservación, derechos y contacto con vigencia; mismo aviso, noindex y sitemap que los términos"
    source: "lo que guardan features/account/server/session.ts, features/cart/server/cookie.ts, features/location/server/actions.ts y app/api/events/route.ts"
    rules: ["RN-SITE-04", "RN-SITE-05", "RN-SITE-06"]
---

# Módulo `site`

## 1. Propósito

Piezas del sitio que no pertenecen a una página: la cabecera y el pie en columnas que monta
`app/layout.tsx` y el contacto de `/vende` (`features/merchants`) y la banda de contacto de `/ayuda` (`app/ayuda/page.tsx`). No lee la ubicación ni la sesión, y no decide el contenido de las páginas a las
que enlaza.

## 2. Reglas de negocio

| Regla | Enunciado | Test que la hace cumplir |
|---|---|---|
| `RN-SITE-01` | El pie muestra a lo sumo 8 categorías raíz, en el orden de la API. | `features/site/__tests__/SiteFooter.test.tsx` ("corta las categorías en 8") |
| `RN-SITE-02` | Sin API (`MarketplaceUnavailableError`) o sin raíces, el pie omite la columna de categorías y conserva el resto. | `features/site/__tests__/SiteFooter.test.tsx` ("omite la columna de categorías si la API falla", "omite la columna de categorías si no hay raíces") |
| `RN-SITE-03` | La banda de contacto de soporte pinta cada botón sólo con su variable y se omite entero si faltan `MERCHANT_WHATSAPP` y `MERCHANT_EMAIL`. | `features/site/__tests__/MerchantContact.test.tsx` |
| `RN-SITE-04` | Los textos legales sólo usan los marcadores de `LEGAL_MARKERS`, y con `LEGAL_DRAFT` en `false` no queda ninguno en el texto. | `features/site/__tests__/legal.test.tsx` ("marcadores legales") |
| `RN-SITE-05` | Con `LEGAL_DRAFT` en `true` las páginas legales llevan `noindex, follow` y quedan fuera del sitemap; en `false` llevan canónica y entran al grupo `static`. | `features/site/__tests__/legal.test.tsx` ("interruptor de borrador") |
| `RN-SITE-06` | El texto de privacidad nombra las cuatro cookies que escribe el sitio (`mp_session`, `mp_cart`, `loc`, `sid`). | `features/site/__tests__/legal.test.tsx` ("privacidad") |
| `RN-SITE-07` | Bajo `md` el carrito y la cuenta salen de la cabecera y viven en la barra inferior; sin sesión, Favoritos y Cuenta llevan a `/entrar` con `volver`. | `e2e/site.spec.ts` ("barra inferior en móvil") |

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Qué muestra la cabecera y cómo se acomoda en móvil | `SiteHeader` en `SiteHeader.tsx` | `e2e/search.spec.ts` y `e2e/cart.spec.ts` buscan el botón de ubicación, "Buscar", el carrito y la cuenta por nombre accesible |
| Destinos, orden o contador de la barra inferior | `tabs` en `MobileNavLinks.tsx` y `MobileNav` en `MobileNav.tsx` | `e2e/cart.spec.ts` y `e2e/checkout.spec.ts` buscan el carrito por nombre accesible dentro de la barra; `e2e/account.spec.ts` la cuenta |
| Columnas o enlaces del pie | `SiteFooter` en `SiteFooter.tsx` | los enlaces que busca `SiteFooter.test.tsx` |
| Interruptor de modo oscuro | `ThemeSwitch` en `ThemeSwitch.tsx` | `ThemeSwitch.test.tsx` y `e2e/site.spec.ts` ("modo oscuro") |
| Cuántas categorías se muestran | `MAX_FOOTER_CATEGORIES` en `SiteFooter.tsx` | RN-SITE-01 y su prueba |
| Botones o textos de contacto de `/vende` y de la banda de `/ayuda` | `MerchantContact` y `MESSAGES` en `MerchantContact.tsx` | RN-SITE-03 y su prueba |
| Metadatos de `/ayuda` o su banda | `app/ayuda/page.tsx` | la canónica sigue en `/ayuda`; el contenido vive en `features/help` |
| Redirección de `/comercios` a `/vende` | `redirects` de `next.config.ts` | permanente (308); `e2e/site.spec.ts` la comprueba |
| Aprobar el texto legal | `LEGAL_DRAFT` en `legal.ts`, tras reemplazar los marcadores en `terms.ts` | RN-SITE-04 y RN-SITE-05; ya no hay aviso ni `noindex` |
| Texto de los términos | `termsDocument` en `terms.ts` | sólo marcadores de `LEGAL_MARKERS` |
| Texto de privacidad, o una cookie o dato nuevo del sitio | `privacyDocument` en `privacy.ts` | comprobarlo contra el código que lo guarda y RN-SITE-06 |
| Una página legal nueva | `LEGAL_PATHS` en `legal.ts`, su documento y `app/<ruta>/page.tsx` sobre `LegalDocument` | sumarla a `registered` en `legal.test.tsx` |
| Íconos del sitio (pestaña, instalación, iOS) | dibujo en `brandIcon` de `brand-icon.tsx`; tamaños y variantes en `ICONS` de `app/icon.tsx` y en `app/apple-icon.tsx` | la inicial y los colores replican la marca de `SiteHeader`; la variante `maskable` mantiene la letra dentro del 80 % central |
| Nombre, colores o íconos de la instalación (manifest) | `manifest` en `app/manifest.ts` (colores en `MANIFEST_*_COLOR` de `lib/site.ts`); `appleWebApp` en `metadata` de `app/layout.tsx` | los `src` de `icons` son los ids de `app/icon.tsx`; `e2e/site.spec.ts` ("el manifest declara la instalación") los pide |
| Cómo se calcula el año | `footerYear` en `year.ts` | sigue en `'use cache'` con `cacheLife` |

## 4. API pública

- `SiteHeader(): React.JSX.Element`, `features/site/components/SiteHeader.tsx`: Server Component síncrono; cada segmento con datos va en su `<Suspense>`.
- `MobileNav(): Promise<React.JSX.Element>`, `features/site/components/MobileNav.tsx`: Server Component async; lee la sesión y el contador del carrito y pinta `MobileNavLinks`. `MobileNavSkeleton(): React.JSX.Element`: barra vacía de la misma altura.
- `MobileNavLinks({ signedIn, cartEnabled, cartCount }: { signedIn: boolean; cartEnabled: boolean; cartCount: number | null }): React.JSX.Element`, `features/site/components/MobileNavLinks.tsx` (`"use client"`): la `<nav>`; marca la ruta activa con `usePathname()` sólo tras hidratar (`useSyncExternalStore`): el HTML del servidor puede venir prerenderizado para otra ruta y no lleva activa, para evitar el aviso de hidratación. El contador del carrito es decorativo (`aria-hidden`; el nombre accesible lo da `cartName`) y usa `text-[10px]` como `CartLink`: `ui.md` no fija un mínimo de tamaño y el contraste lo cubren los tokens (`bg-primary` con `text-primary-foreground`).
- `SiteFooter(): Promise<React.JSX.Element>`, `features/site/components/SiteFooter.tsx`: Server Component async.
- `FooterCategories({ categories }: { categories: CategoryNode[] }): React.JSX.Element | null`, `features/site/components/SiteFooter.tsx`: columna de categorías; `null` con la lista vacía.
- `footerYear(): Promise<number>`, `features/site/lib/year.ts`: año actual, en caché de `cacheLife("days")`.
- `merchantContactHref(whatsapp: string | null, email: string | null, purpose?: "merchant" | "support"): string | null`, `features/site/components/MerchantContact.tsx`: destino de contacto con el mensaje del propósito (`merchant` por defecto, el alta de comercio; `support`, la ayuda al comprador): `https://wa.me/<dígitos>?text=...`, si no `mailto:<correo>`, y `null` sin ninguno; lo usan los CTA de `/vende`.
- `MerchantContact({ whatsapp, email }: { whatsapp: string | null; email: string | null }): React.JSX.Element | null`, `features/site/components/MerchantContact.tsx`: banda de soporte de `/ayuda`; `null` si ambos son `null`.
- `ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element`, `features/site/components/ThemeProvider.tsx` (`"use client"`): `next-themes` con `attribute="class"`, `defaultTheme="system"`, `enableSystem` y `disableTransitionOnChange`; `app/layout.tsx` lo monta alrededor del contenido del `body`.
- `ThemeSwitch({ className, switchClassName }: { className?: string; switchClassName?: string }): React.JSX.Element`, `features/site/components/ThemeSwitch.tsx` (`"use client"`): fila con ícono `Moon`, "Modo oscuro" y `Switch` (`role="switch"`); `aria-checked` sale de `resolvedTheme === "dark"` sólo tras hidratar y al cambiarlo fija `dark` o `light`. `switchClassName` son las clases del `Switch` para pintarlo sobre un fondo como `bg-ink` (borde, track, thumb y foco con tokens `ink`); `SiteFooter` se las pasa. Lo monta `SiteFooter`.
- `LegalDocument({ document }: { document: LegalDocumentContent }): React.JSX.Element`, `features/site/components/LegalDocument.tsx`: prosa legal con aviso de borrador.
- `LEGAL_DRAFT: boolean`, `LEGAL_MARKERS: readonly string[]` y `LEGAL_PATHS: readonly string[]`, `features/site/lib/legal.ts`: interruptor, los cinco marcadores permitidos y las rutas legales registradas.
- `legalMetadata({ title, description, path }, draft?): Metadata`, `legalSitemapPaths(draft?): readonly string[]` y `legalText(document): string`, `features/site/lib/legal.ts`.
- `brandIcon(size: number, variant: BrandIconVariant): Promise<ImageResponse>` y `BrandIconVariant = "rounded" | "bleed" | "maskable"`, `features/site/lib/brand-icon.tsx`: PNG cuadrado con la inicial de `SITE_NAME` en Poppins negrita, `--primary` sobre `--ink`; `rounded` con esquinas redondeadas y transparentes, `bleed` a sangre sin transparencia, `maskable` a sangre con la letra a la mitad del lado (zona segura). Lo usan `app/icon.tsx` (ids `32`, `192`, `512` y `maskable`, servidos en `/icon/<id>`; un id desconocido responde 404 con `notFound()`) y `app/apple-icon.tsx` (180 px, `/apple-icon`).
- `termsDocument: LegalDocumentContent`, `features/site/lib/terms.ts`: texto de `/terminos`.
- `privacyDocument: LegalDocumentContent`, `features/site/lib/privacy.ts`: texto de `/privacidad`.

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| `SiteHeader` | `features/site/components/SiteHeader.tsx` | logo con ficha de la inicial de `SITE_NAME`, `LocationBar degrade`, `SearchPill compact` en `HeaderSearchSlot` (segunda fila en móvil), enlace a `/tiendas` (`buttonVariants` ghost), enlace a `/cuenta/favoritos`, `CartLink` y `AccountSlot`, todos en un grupo `hidden md:flex` |
| `MobileNav` | `features/site/components/MobileNav.tsx` | `cartEnabled()`, `accountContext()` y `cartCount()` en paralelo; el contador sólo se pide con el carrito encendido |
| `tabs` | `features/site/components/MobileNavLinks.tsx` | arma los cinco destinos (Carrito sólo con `cartEnabled`); Favoritos y Cuenta usan `loginHref` sin sesión; Cuenta no se marca activa en `/cuenta/favoritos`; el carrito con productos nombra "Carrito, N producto(s)" |
| `rootCategories` | `features/site/components/SiteFooter.tsx` | lee `listCategories()`, recorta a 8 y devuelve `[]` ante `MarketplaceUnavailableError` |
| `MESSAGES` | `features/site/components/MerchantContact.tsx` | mensaje de WhatsApp de cada `purpose` (alta de comercio y ayuda) |
| `merchantContactHref` | `features/site/components/MerchantContact.tsx` | arma el destino de contacto (WhatsApp, correo o `null`) para los CTA de `features/merchants` |
| `termsDocument` | `features/site/lib/terms.ts` | secciones de los términos con `SITE_NAME` y los marcadores |
| `privacyDocument` | `features/site/lib/privacy.ts` | ocho secciones de privacidad con `SITE_NAME` y los marcadores |
| `ThemeProvider` | `features/site/components/ThemeProvider.tsx` | pone la clase `dark` en `<html>` según la preferencia guardada o, sin ella, `prefers-color-scheme` |
| `ThemeSwitch` | `features/site/components/ThemeSwitch.tsx` | interruptor de dos estados sobre `useTheme()`; pintado tras hidratar (`useSyncExternalStore`, L-10) para no desajustar con el HTML prerenderizado; la prueba de L-10 renderiza con `renderToString` y exige `aria-checked="false"` aunque el tema resuelto sea `dark` |
| `brandIcon` | `features/site/lib/brand-icon.tsx` | único dibujo de la marca para íconos; los colores son los de `app/globals.css` escritos como literales porque `ImageResponse` no lee variables CSS; la tipografía es Poppins 700 como la marca de la cabecera, leída con `readFile` de `features/site/assets/Poppins-Bold.ttf` (ruta desde `process.cwd()`; `fetch` de una URL de archivo falla en el servidor compilado) porque `ImageResponse` no admite woff2 ni `next/font`; la fuente va bajo licencia SIL OFL 1.1 |
| `FooterColumn` | `features/site/components/SiteFooter.tsx` | título `h2` y lista dentro de un `<nav aria-label>` propio |

## 6. Dependencias

- `lib/marketplace/client.ts` (`listCategories`), `lib/marketplace/errors.ts`, `lib/marketplace/params.ts` (`DEFAULT_RADIUS_KM`) y `lib/marketplace/schemas.ts` (`CategoryNode`, sólo tipo).
- `features/search/lib/query.ts` (`searchHref`, su única dependencia sobre ese archivo; el pie no pasa `openNow` ni `sort`, así que la URL queda sin `abierto` ni `orden`) y `lib/site.ts` (`SITE_NAME`, `SITE_DESCRIPTION`, `POS_NAME`, `MANIFEST_BACKGROUND_COLOR`, `MANIFEST_THEME_COLOR`, `merchantWhatsapp`, `merchantEmail`).
- `next` (tipo `Metadata`) en `legal.ts`; `next-themes` en `ThemeProvider`.
- `features/account/lib/returnPath.ts` (`loginHref`), `features/account/server/session.ts` (`accountContext`), `features/cart/components/CartLink.tsx` (`cartCount`) y `features/cart/lib/flag.ts` (`cartEnabled`) en `MobileNav`. `cartCount` lee `getSessionCart()` de `features/cart/server/cart.ts` sin argumento (`deliveryKey` vacío, la clave de `cache` sin entrega elegida; la ubicación de la cookie `loc` se lee dentro) y sólo usa `line_count`; `lucide-react` y `next/navigation` (`usePathname`) en `MobileNavLinks`.
- `features/location/components/LocationBar.tsx`, `features/search/components/HeaderSearchSlot.tsx` y `SearchPill.tsx`, `features/cart/components/CartLink.tsx` y `features/account/components/AccountMenu.tsx` en `SiteHeader`.
- `components/ui/button.tsx` (`buttonVariants`), `components/ui/switch.tsx` (`Switch`) y `lib/utils.ts` (`cn`).
- `next/og` (`ImageResponse`), `node:fs/promises` y `features/site/assets/Poppins-Bold.ttf` (Poppins, licencia SIL OFL 1.1) en `brand-icon.tsx`.
- `next` (tipo `MetadataRoute.Manifest`) y `lib/site.ts` (`SITE_NAME`, `SITE_DESCRIPTION`, `MANIFEST_BACKGROUND_COLOR`, `MANIFEST_THEME_COLOR`) en `app/manifest.ts`, que `e2e/site.spec.ts` importa también.
- `next/link` y `next/cache` (`cacheLife`). `app/ayuda/page.tsx` usa `features/help/components/HelpCenter.tsx`.  `app/vende/page.tsx` usa `features/merchants/components/MerchantsLanding.tsx`, que importa `merchantContactHref` de este módulo.

## 7. Ejemplo de uso

```tsx
import { SiteFooter } from "@/features/site/components/SiteFooter";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
```

## 8. Restricciones

- `SiteHeader` y `SiteFooter` viven en el layout raíz, fuera de `app/error.tsx` (L-02): atrapa sólo `MarketplaceUnavailableError` y relanza lo demás.
- El año sale de una función `'use cache'`: `new Date()` en el render exigiría `connection()` y volvería dinámico el layout.
- Cada enlace mide al menos 44 px de alto en móvil.
- La barra inferior es `fixed` y sólo bajo `md`: `app/layout.tsx` da al `body` un relleno inferior (`3.5rem` más el área segura) para que no tape el pie. En móvil "Salir" vive en las pestañas de `/cuenta` (`AccountNav`).
- El `Toaster` (`app/layout.tsx`, primitiva `components/ui/sonner.tsx`) toma `offset.bottom` y `mobileOffset.bottom` de `--toast-offset` (`app/globals.css`), que parte de `--toast-bottom`: sobre la barra inferior (`4rem` más el área segura) bajo `md` y `24px`, el de defecto de sonner, desde `md`. Bajo `md`, con una barra de compra en la página (`:root:has([data-purchase-bar])`), `--toast-offset` suma `6rem` para quedar encima de ella. Sonner sólo usa `mobileOffset` bajo 600 px, así que entre 600 y 767 px manda `offset`; por eso ambos leen la misma variable, sin medir en JS.
- El tema se lee en el cliente (localStorage de `next-themes` y su script): con `cacheComponents` el layout no puede leer una cookie, y `<html>` lleva `suppressHydrationWarning` porque el script cambia su clase antes de hidratar. `viewport.themeColor` es la pareja por `media` (`#ffffff` y `#28292d`); el `Toaster` toma `resolvedTheme` de `useTheme()`.
- `theme_color` del manifest es `#28292d` (tinta) aunque `viewport.themeColor` use `#ffffff` en claro: la barra de la app instalada lleva el color de la marca, y no se alinea con el viewport.
- Los íconos se generan por código (sin binarios) y no hay `app/favicon.ico`. Next enlaza también el ícono `maskable` como `rel="icon"` por ser parte del mismo `generateImageMetadata`; el manifest es quien lo declara con `purpose: maskable`. No hay service worker ni caché sin conexión: el sitio instalable necesita red para precios y stock al día.
- Las variables de contacto se leen al construir la página (prerender): cambiarlas exige un build nuevo. Los clics de contacto no se registran: `POST /api/events` exige `store_slug`.
- `/comercios` redirige de forma permanente (308) a `/vende` desde `next.config.ts` y no figura en el sitemap.
- `/terminos` y `/privacidad` son borradores: aviso visible, `noindex, follow` y fuera del sitemap hasta que el área legal apruebe el texto y se ponga `LEGAL_DRAFT` en `false`. Sus textos no afirman nada que el sitio no haga: las cookies y los datos de `/privacidad` salen de `features/account/server/session.ts`, `features/cart/server/cookie.ts`, `features/location/server/actions.ts` y `app/api/events/route.ts`.
- `/vende` (`app/vende/page.tsx`, contenido en `features/merchants`) es indexable, con canónica propia y entrada en el grupo `static`.
- `/ayuda` (`app/ayuda/page.tsx`) es indexable, con canónica propia y entrada en el grupo `static`; monta `HelpCenter` de `features/help` y la banda de soporte, que no promete horarios de atención.
- Los enlaces a `/ayuda`, `/vende`, `/terminos` y `/privacidad` son rutas fijas; la marca sale sólo de `SITE_NAME`.

## 9. Pruebas

- Comando: `npx vitest run features/site lib/__tests__/sitemap.test.ts`
- `e2e/site.spec.ts` ("modo oscuro"): con `colorScheme: "dark"` emulado `<html>` lleva `dark`, con `light` no, y la consola no avisa de hidratación; el interruptor del pie lo activa y la elección sobrevive a la recarga; con Tab se alcanza el interruptor del pie, su contorno de foco es visible (color `--ink-foreground`) y Espacio cambia el tema.
- `e2e/site.spec.ts` ("el manifest declara la instalación"): `/manifest.webmanifest` con nombre, `start_url`, `display`, `lang`, colores y los tres íconos con su `purpose`; cada ícono responde 200 con su tipo, y el `<head>` de `/` enlaza el manifest, el título de iOS y `apple-touch-icon`.
- `features/site/__tests__/ThemeSwitch.test.tsx`: `aria-checked` según el tema resuelto y `setTheme` con `dark` o `light`, y (L-10) con `renderToString` el HTML previo a hidratar trae `aria-checked="false"` aunque el tema resuelto sea `dark`; simula `next-themes`.
- `e2e/site.spec.ts` ("barra inferior en móvil"): los cinco destinos (sin Tiendas), el activo, Favoritos y Cuenta hacia `/entrar` sin sesión, carrito y cuenta ocultos en la cabecera, y que logo y ubicación no envuelvan en 360 y 320 px.
- `features/site/__tests__/MerchantContact.test.tsx`: sin variables no pinta, cada botón sólo con su dato, y el título, el mensaje y la banda de soporte. `lib/__tests__/sitemap.test.ts` cubre las entradas `/tiendas`, `/ayuda` y `/vende` del grupo `static`. `e2e/site.spec.ts` comprueba `/ayuda` (canónica, filtro de preguntas, enlace del pie) y `/vende` (canónica, secciones y CTA con destino), y el 308 de `/comercios`.
- `features/site/__tests__/legal.test.tsx`: marcadores permitidos, guarda sin borrador, metadatos y sitemap según el interruptor, el aviso de `LegalDocument` y las cuatro cookies de privacidad.
- `features/site/__tests__/SiteFooter.test.tsx`: categorías y enlaces, corte en 8, columna omitida con API caída o sin raíces, error ajeno relanzado; simula `@/lib/marketplace/client` y `@/features/site/lib/year` (`cacheLife` no corre en vitest).

---
module: "site"
path: "features/site"
type: "feature"
exports: ["SiteFooter", "FooterCategories", "footerYear", "MerchantContact", "LegalDocument", "LEGAL_DRAFT", "LEGAL_MARKERS", "LEGAL_PATHS", "legalMetadata", "legalSitemapPaths", "legalText", "termsDocument", "privacyDocument"]
depends_on: ["lib/marketplace/client.ts", "lib/marketplace/errors.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/site.ts", "features/search/query.ts", "components/ui/button.tsx", "lib/utils.ts"]
tests: "features/site/*.test.tsx"
verified_against: ["features/site/SiteFooter.tsx", "features/site/year.ts", "features/site/SiteFooter.test.tsx", "features/site/MerchantContact.tsx", "features/site/MerchantContact.test.tsx", "app/comercios/page.tsx", "lib/sitemap.ts", "app/layout.tsx", "lib/site.ts", "features/search/query.ts", "lib/marketplace/client.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "features/site/legal.ts", "features/site/legal.test.tsx", "features/site/LegalDocument.tsx", "features/site/terms.ts", "app/terminos/page.tsx", "features/site/privacy.ts", "app/privacidad/page.tsx", "features/account/session.ts", "features/cart/server/cookie.ts", "features/cart/server/cart.ts", "features/location/lib/cookie.ts", "features/location/server/actions.ts", "app/api/events/route.ts", "features/events/lib/handle.ts"]
capabilities:
  - intent: "mostrar el pie del sitio con sus columnas de enlaces"
    intent_aliases: ["pie de pagina", "footer", "enlaces legales", "categorias del pie", "para comercios"]
    entrypoint: "<SiteFooter />"
    file: "features/site/SiteFooter.tsx"
    input: "sin props; se monta en app/layout.tsx después de <main>"
    output: "footer con columnas Marca (SITE_NAME y SITE_DESCRIPTION), Categorías (hasta 8 raíces de listCategories() hacia /buscar?categoria=<slug>), Comercios (/comercios), Legal (/terminos y /privacidad) y la línea '© <año> SITE_NAME'; sin API o sin raíces no pinta la columna de categorías"
    source: "listCategories() de lib/marketplace/client.ts y footerYear()"
    rules: ["RN-SITE-01", "RN-SITE-02"]
  - intent: "ofrecer contacto a un comercio que quiere aparecer en el buscador"
    intent_aliases: ["para comercios", "contacto comercios", "whatsapp comercios", "captar tiendas"]
    entrypoint: "<MerchantContact whatsapp={string | null} email={string | null} />"
    file: "features/site/MerchantContact.tsx"
    input: "whatsapp (dígitos) y email, cada uno string o null; la página los toma de merchantWhatsapp() y merchantEmail() de lib/site.ts"
    output: "bloque con botón de WhatsApp (https://wa.me/<dígitos>?text=...) y enlace mailto:, cada uno sólo con su dato; null si faltan ambos"
    source: "variables de entorno MERCHANT_WHATSAPP y MERCHANT_EMAIL, leídas al construir"
    rules: ["RN-SITE-03"]
  - intent: "publicar los términos de uso como borrador legal"
    intent_aliases: ["terminos y condiciones", "terminos de uso", "texto legal", "borrador legal", "marcadores legales"]
    entrypoint: "<LegalDocument document={termsDocument} />"
    file: "features/site/LegalDocument.tsx"
    input: "document: LegalDocumentContent (título y secciones con párrafos y viñetas); el texto de términos es termsDocument de features/site/terms.ts"
    output: "artículo con h1, una sección h2 por apartado y, mientras LEGAL_DRAFT sea true, el aviso 'Borrador pendiente de revisión legal'; la página usa legalMetadata (noindex, follow en borrador; canónica propia sin él)"
    source: "LEGAL_DRAFT y LEGAL_MARKERS de features/site/legal.ts"
    rules: ["RN-SITE-04", "RN-SITE-05"]
  - intent: "publicar la política de privacidad como borrador legal"
    intent_aliases: ["privacidad", "politica de privacidad", "cookies", "proteccion de datos", "derechos del usuario"]
    entrypoint: "<LegalDocument document={privacyDocument} />"
    file: "features/site/privacy.ts"
    input: "sin props; privacyDocument de features/site/privacy.ts, que app/privacidad/page.tsx pasa a LegalDocument"
    output: "ocho secciones: responsable, datos, cookies (mp_session, mp_cart, loc y sid), finalidades, terceros, conservación, derechos y contacto con vigencia; mismo aviso, noindex y sitemap que los términos"
    source: "lo que guardan features/account/session.ts, features/cart/server/cookie.ts, features/location/server/actions.ts y app/api/events/route.ts"
    rules: ["RN-SITE-04", "RN-SITE-05", "RN-SITE-06"]
---

# Módulo `site`

## 1. Propósito

Piezas del sitio que no pertenecen a una página: el pie en columnas que monta
`app/layout.tsx` y el contacto de `/comercios` (`app/comercios/page.tsx`). No lee la ubicación ni la sesión, y no decide el contenido de las páginas a las
que enlaza.

## 2. Reglas de negocio

| Regla | Enunciado | Test que la hace cumplir |
|---|---|---|
| `RN-SITE-01` | El pie muestra a lo sumo 8 categorías raíz, en el orden de la API. | `features/site/SiteFooter.test.tsx` ("corta las categorías en 8") |
| `RN-SITE-02` | Sin API (`MarketplaceUnavailableError`) o sin raíces, el pie omite la columna de categorías y conserva el resto. | `features/site/SiteFooter.test.tsx` ("omite la columna de categorías si la API falla", "omite la columna de categorías si no hay raíces") |
| `RN-SITE-03` | El contacto de comercios pinta cada botón sólo con su variable y se omite entero si faltan `MERCHANT_WHATSAPP` y `MERCHANT_EMAIL`. | `features/site/MerchantContact.test.tsx` |
| `RN-SITE-04` | Los textos legales sólo usan los marcadores de `LEGAL_MARKERS`, y con `LEGAL_DRAFT` en `false` no queda ninguno en el texto. | `features/site/legal.test.tsx` ("marcadores legales") |
| `RN-SITE-05` | Con `LEGAL_DRAFT` en `true` las páginas legales llevan `noindex, follow` y quedan fuera del sitemap; en `false` llevan canónica y entran al grupo `static`. | `features/site/legal.test.tsx` ("interruptor de borrador") |
| `RN-SITE-06` | El texto de privacidad nombra las cuatro cookies que escribe el sitio (`mp_session`, `mp_cart`, `loc`, `sid`). | `features/site/legal.test.tsx` ("privacidad") |

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Columnas o enlaces del pie | `SiteFooter` en `SiteFooter.tsx` | los enlaces que busca `SiteFooter.test.tsx` |
| Cuántas categorías se muestran | `MAX_FOOTER_CATEGORIES` en `SiteFooter.tsx` | RN-SITE-01 y su prueba |
| Botones de contacto de `/comercios` | `MerchantContact` en `MerchantContact.tsx` | RN-SITE-03 y su prueba |
| Texto, pasos o metadatos de `/comercios` | `app/comercios/page.tsx` | la canónica sigue en `/comercios` |
| Aprobar el texto legal | `LEGAL_DRAFT` en `legal.ts`, tras reemplazar los marcadores en `terms.ts` | RN-SITE-04 y RN-SITE-05; ya no hay aviso ni `noindex` |
| Texto de los términos | `termsDocument` en `terms.ts` | sólo marcadores de `LEGAL_MARKERS` |
| Texto de privacidad, o una cookie o dato nuevo del sitio | `privacyDocument` en `privacy.ts` | comprobarlo contra el código que lo guarda y RN-SITE-06 |
| Una página legal nueva | `LEGAL_PATHS` en `legal.ts`, su documento y `app/<ruta>/page.tsx` sobre `LegalDocument` | sumarla a `registered` en `legal.test.tsx` |
| Cómo se calcula el año | `footerYear` en `year.ts` | sigue en `'use cache'` con `cacheLife` |

## 4. API pública

- `SiteFooter(): Promise<React.JSX.Element>`, `features/site/SiteFooter.tsx`: Server Component async.
- `FooterCategories({ categories }: { categories: CategoryNode[] }): React.JSX.Element | null`, `features/site/SiteFooter.tsx`: columna de categorías; `null` con la lista vacía.
- `footerYear(): Promise<number>`, `features/site/year.ts`: año actual, en caché de `cacheLife("days")`.
- `MerchantContact({ whatsapp, email }: { whatsapp: string | null; email: string | null }): React.JSX.Element | null`, `features/site/MerchantContact.tsx`: bloque de contacto; `null` si ambos son `null`.
- `LegalDocument({ document }: { document: LegalDocumentContent }): React.JSX.Element`, `features/site/LegalDocument.tsx`: prosa legal con aviso de borrador.
- `LEGAL_DRAFT: boolean`, `LEGAL_MARKERS: readonly string[]` y `LEGAL_PATHS: readonly string[]`, `features/site/legal.ts`: interruptor, los cinco marcadores permitidos y las rutas legales registradas.
- `legalMetadata({ title, description, path }, draft?): Metadata`, `legalSitemapPaths(draft?): readonly string[]` y `legalText(document): string`, `features/site/legal.ts`.
- `termsDocument: LegalDocumentContent`, `features/site/terms.ts`: texto de `/terminos`.
- `privacyDocument: LegalDocumentContent`, `features/site/privacy.ts`: texto de `/privacidad`.

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| `rootCategories` | `features/site/SiteFooter.tsx` | lee `listCategories()`, recorta a 8 y devuelve `[]` ante `MarketplaceUnavailableError` |
| `steps` | `app/comercios/page.tsx` | los tres pasos de la página |
| `termsDocument` | `features/site/terms.ts` | secciones de los términos con `SITE_NAME` y los marcadores |
| `privacyDocument` | `features/site/privacy.ts` | ocho secciones de privacidad con `SITE_NAME` y los marcadores |
| `FooterColumn` | `features/site/SiteFooter.tsx` | título `h2` y lista dentro de un `<nav aria-label>` propio |

## 6. Dependencias

- `lib/marketplace/client.ts` (`listCategories`), `lib/marketplace/errors.ts`, `lib/marketplace/params.ts` (`DEFAULT_RADIUS_KM`) y `lib/marketplace/schemas.ts` (`CategoryNode`, sólo tipo).
- `features/search/query.ts` (`searchHref`) y `lib/site.ts` (`SITE_NAME`, `SITE_DESCRIPTION`, `POS_NAME`, `merchantWhatsapp`, `merchantEmail`).
- `next` (tipo `Metadata`) en `legal.ts`.
- `components/ui/button.tsx` (`buttonVariants`) y `lib/utils.ts` (`cn`).
- `next/link` y `next/cache` (`cacheLife`).

## 7. Ejemplo de uso

```tsx
import { SiteFooter } from "@/features/site/SiteFooter";

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

- `SiteFooter` vive en el layout raíz, fuera de `app/error.tsx` (L-02): atrapa sólo `MarketplaceUnavailableError` y relanza lo demás.
- El año sale de una función `'use cache'`: `new Date()` en el render exigiría `connection()` y volvería dinámico el layout.
- Cada enlace mide al menos 44 px de alto en móvil.
- Las variables de contacto se leen al construir la página (prerender): cambiarlas exige un build nuevo. Los clics de contacto no se registran: `POST /api/events` exige `store_slug`.
- `/comercios` es indexable, con canónica propia y entrada en el grupo `static` de `lib/sitemap.ts`; la marca del punto de venta sale de `POS_NAME`.
- `/terminos` y `/privacidad` son borradores: aviso visible, `noindex, follow` y fuera del sitemap hasta que el área legal apruebe el texto y se ponga `LEGAL_DRAFT` en `false`. Sus textos no afirman nada que el sitio no haga: las cookies y los datos de `/privacidad` salen de `features/account/session.ts`, `features/cart/server/cookie.ts`, `features/location/server/actions.ts` y `app/api/events/route.ts`.
- Los enlaces a `/comercios`, `/terminos` y `/privacidad` son rutas fijas; la marca sale sólo de `SITE_NAME`.

## 9. Pruebas

- Comando: `npx vitest run features/site lib/sitemap.test.ts`
- `features/site/MerchantContact.test.tsx`: sin variables no pinta, y cada botón sólo con su dato. `lib/sitemap.test.ts` cubre la entrada `/comercios` del grupo `static`.
- `features/site/legal.test.tsx`: marcadores permitidos, guarda sin borrador, metadatos y sitemap según el interruptor, el aviso de `LegalDocument` y las cuatro cookies de privacidad.
- `features/site/SiteFooter.test.tsx`: categorías y enlaces, corte en 8, columna omitida con API caída o sin raíces, error ajeno relanzado; simula `@/lib/marketplace/client` y `./year` (`cacheLife` no corre en vitest).

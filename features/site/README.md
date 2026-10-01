---
module: "site"
path: "features/site"
type: "feature"
exports: ["SiteFooter", "FooterCategories", "footerYear", "MerchantContact"]
depends_on: ["lib/marketplace/client.ts", "lib/marketplace/errors.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts", "lib/site.ts", "features/search/query.ts", "components/ui/button.tsx", "lib/utils.ts"]
tests: "features/site/*.test.tsx"
verified_against: ["features/site/SiteFooter.tsx", "features/site/year.ts", "features/site/SiteFooter.test.tsx", "features/site/MerchantContact.tsx", "features/site/MerchantContact.test.tsx", "app/comercios/page.tsx", "lib/sitemap.ts", "app/layout.tsx", "lib/site.ts", "features/search/query.ts", "lib/marketplace/client.ts", "lib/marketplace/params.ts", "lib/marketplace/schemas.ts"]
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

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
| Columnas o enlaces del pie | `SiteFooter` en `SiteFooter.tsx` | los enlaces que busca `SiteFooter.test.tsx` |
| Cuántas categorías se muestran | `MAX_FOOTER_CATEGORIES` en `SiteFooter.tsx` | RN-SITE-01 y su prueba |
| Botones de contacto de `/comercios` | `MerchantContact` en `MerchantContact.tsx` | RN-SITE-03 y su prueba |
| Texto, pasos o metadatos de `/comercios` | `app/comercios/page.tsx` | la canónica sigue en `/comercios` |
| Cómo se calcula el año | `footerYear` en `year.ts` | sigue en `'use cache'` con `cacheLife` |

## 4. API pública

- `SiteFooter(): Promise<React.JSX.Element>`, `features/site/SiteFooter.tsx`: Server Component async.
- `FooterCategories({ categories }: { categories: CategoryNode[] }): React.JSX.Element | null`, `features/site/SiteFooter.tsx`: columna de categorías; `null` con la lista vacía.
- `footerYear(): Promise<number>`, `features/site/year.ts`: año actual, en caché de `cacheLife("days")`.
- `MerchantContact({ whatsapp, email }: { whatsapp: string | null; email: string | null }): React.JSX.Element | null`, `features/site/MerchantContact.tsx`: bloque de contacto; `null` si ambos son `null`.

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| `rootCategories` | `features/site/SiteFooter.tsx` | lee `listCategories()`, recorta a 8 y devuelve `[]` ante `MarketplaceUnavailableError` |
| `steps` | `app/comercios/page.tsx` | los tres pasos de la página |
| `FooterColumn` | `features/site/SiteFooter.tsx` | título `h2` y lista dentro de un `<nav aria-label>` propio |

## 6. Dependencias

- `lib/marketplace/client.ts` (`listCategories`), `lib/marketplace/errors.ts`, `lib/marketplace/params.ts` (`DEFAULT_RADIUS_KM`) y `lib/marketplace/schemas.ts` (`CategoryNode`, sólo tipo).
- `features/search/query.ts` (`searchHref`) y `lib/site.ts` (`SITE_NAME`, `SITE_DESCRIPTION`, `POS_NAME`, `merchantWhatsapp`, `merchantEmail`).
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
- Los enlaces a `/comercios`, `/terminos` y `/privacidad` son rutas fijas; la marca sale sólo de `SITE_NAME`.

## 9. Pruebas

- Comando: `npx vitest run features/site lib/sitemap.test.ts`
- `features/site/MerchantContact.test.tsx`: sin variables no pinta, y cada botón sólo con su dato. `lib/sitemap.test.ts` cubre la entrada `/comercios` del grupo `static`.
- `features/site/SiteFooter.test.tsx`: categorías y enlaces, corte en 8, columna omitida con API caída o sin raíces, error ajeno relanzado; simula `@/lib/marketplace/client` y `./year` (`cacheLife` no corre en vitest).

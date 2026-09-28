---
paths:
  - "components/**"
---

# Primitivas de UI

Rige al editar `components/`. Las primitivas viven en `components/ui/` (`Button`, `Input`,
`Badge`, `Card`, `Skeleton`) y los tokens en `app/globals.css`.

1. **Sin estado ni `'use client'`.** Una primitiva recibe props y pinta; no usa hooks. Así la usan
   por igual Server y Client Components. Lo interactivo vive en quien la consume.
2. **Props nativas más variantes.** Cada primitiva extiende `ComponentProps<"elemento">`, reparte
   `...props` al elemento y combina su `className` al final. `Button` pone `type="button"` por
   defecto; un enlace con forma de botón usa `buttonClasses(variant, size)` sobre `<Link>`.
3. **Clases por `cx`** (`components/ui/cx.ts`), que descarta `false`, `null` y `undefined`. Sin
   concatenar plantillas a mano.
4. **Colores sólo por tokens**: `bg-primary`, `hover:bg-primary-hover`, `text-primary-foreground`,
   `bg-muted`, `text-muted-foreground`, `border-border`, `bg-featured`, `text-warning`,
   `bg-background`, `text-foreground`. Nada de `zinc-*`, `black`, `white` ni hex en clases. Un color
   nuevo entra como variable en `:root` y su `--color-*` en `@theme inline` de `app/globals.css`.
   No hay modo oscuro.
5. **Contraste AA.** El texto sobre el naranja de marca es oscuro (`text-primary-foreground`),
   nunca blanco. El foco visible usa `outline-foreground`, no el primario, porque el naranja sobre
   blanco no llega a 3:1.
6. **Nombre accesible en todo control**; lo decorativo lleva `aria-hidden` (`Skeleton` ya lo trae).
7. **Sin dependencias de componentes** (shadcn, Radix, Headless UI, iconos) sin aprobación de quien
   coordina: se escribe con Tailwind y HTML.

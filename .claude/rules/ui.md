---
paths:
  - "components/**"
---

# Primitivas de UI

Rige al editar `components/`. Las primitivas viven en `components/ui/` y son las de shadcn
(`Button`, `Badge`, `Card`, `Input`, `Skeleton`); los tokens, en `app/globals.css`. Una primitiva
nueva se agrega con `shadcn add` y se ajusta a los tokens y a las reglas de abajo.

1. **Sin estado, sin `'use client'`.** Las primitivas que no lo necesitan no llevan `'use client'`
   ni hooks, para que las usen por igual Server y Client Components. Las interactivas (`Sheet`,
   `Select` y `ToggleGroup`) traen el suyo y se consumen desde Server Components; `Toggle` no lo
   lleva para que `toggleVariants` sirva en el servidor (Radix ya marca su primitiva).
2. **Props nativas más variantes.** Cada primitiva extiende las props de su elemento, reparte
   `...props` y recibe `className`. `Button` pone `type="button"` por defecto cuando renderiza
   `<button>`.
3. **Clases por `cn` de `@/lib/utils`**, sin concatenar plantillas a mano. `cn` resuelve conflictos
   de Tailwind: el `className` de quien usa la primitiva gana sobre la base. Una utilidad de clases
   exportada para usarse fuera del componente también pasa por `cn`. Un enlace con forma de botón
   usa `buttonVariants` sobre `<Link>`, no un `<button>` anidado; `toggleVariants` sobre `<Link>`
   igual que `buttonVariants`, por `cn`.
4. **Colores sólo por tokens**: `bg-primary`, `hover:bg-primary-hover`, `text-primary-foreground`,
   `bg-muted`, `text-muted-foreground`, `border-border`, `border-input-border`, `border-input`,
   `bg-card`, `bg-featured`, `text-warning`, `bg-best`, `text-best-foreground`, `border-best-foreground`, `bg-background`, `text-foreground`, `bg-surface`,
   `bg-glass`, `border-glass-border`, `bg-primary-soft`, `bg-tint-N`/`text-tint-N-foreground`
   (N de 1 a 4), `bg-overlay`, `bg-popover`, `shadow-card`, `shadow-raised`. Nada de
   `zinc-*`, `black`, `white` ni hex en clases. Un color nuevo entra como variable en `:root` y su
   `--color-*` en `@theme inline` de `app/globals.css`. Los radios son la escala de shadcn
   (`rounded-md`, `rounded-lg`...), derivada de `--radius`. No hay modo oscuro. El desenfoque va
   sólo en la cabecera y en el buscador grande.
5. **Contraste AA.** El texto sobre el naranja de marca es oscuro (`text-primary-foreground`),
   nunca blanco. El foco visible usa `outline-foreground`, no el primario, porque el naranja sobre
   blanco no llega a 3:1; el ring de shadcn no reemplaza ese outline. Los bordes de controles de
   formulario usan `border-input-border` (`--border` no llega a 3:1 sobre blanco); `border-border`
   queda para tarjetas y separadores. Los controles principales miden al menos 44 px de alto
   (`h-11`).
6. **Nombre accesible en todo control**; lo decorativo lleva `aria-hidden` (`Skeleton` ya lo trae).
7. **Íconos sólo de `lucide-react`**, importados por nombre, con `aria-hidden` en lo decorativo.
   shadcn y Radix se permiten; otra librería de componentes (Headless UI, MUI y similares) no entra
   sin aprobación de quien coordina.

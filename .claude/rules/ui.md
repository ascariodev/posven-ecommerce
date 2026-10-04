---
paths:
  - "components/**"
---

# Primitivas de UI

Rige al editar `components/`. Las primitivas viven en `components/ui/`, en estilo shadcn
`radix-luma`: `Badge`, `Button`, `Card`, `DropdownMenu`, `Input`, `RadioGroup`, `Select`, `Sheet`,
`Skeleton`, `Toaster` (`sonner`), `Toggle` y `ToggleGroup`. Tokens en `app/globals.css`. Una
primitiva nueva se agrega con `shadcn add` y se ajusta a los tokens y a las reglas de abajo; el CLI
escribe `import { cn } from "cn"`, que se corrige a `@/lib/utils`.

1. **Sin estado, sin `'use client'`.** Las primitivas que no lo necesitan no llevan `'use client'`
   ni hooks, para que las usen por igual Server y Client Components. Las interactivas (`Sheet`,
   `Select`, `ToggleGroup`, `DropdownMenu`, `RadioGroup` y `Toaster`) traen el suyo y se importan
   desde Server o Client Components. `Toggle` no lo lleva para que `toggleVariants` sirva en el
   servidor (Radix ya marca su primitiva).
2. **Props nativas más variantes.** Cada primitiva extiende las props de su elemento, reparte
   `...props` y recibe `className`. `Button` pone `type="button"` por defecto cuando renderiza
   `<button>`.
3. **Clases por `cn` de `@/lib/utils`**, sin concatenar plantillas a mano. `cn` resuelve conflictos
   de Tailwind: el `className` de quien usa la primitiva gana sobre la base. Una utilidad de clases
   exportada para usarse fuera del componente también pasa por `cn`. Un enlace con forma de botón
   usa `buttonVariants` sobre `<Link>`, no un `<button>` anidado; `toggleVariants` sobre `<Link>`
   igual que `buttonVariants`. Ambas ya devuelven su resultado por `cn`: sin clases extra se usan
   tal cual y con clases extra, `cn(buttonVariants(...), "extra")`. `cn` registra las sombras `shadow-card` y `shadow-raised`
   para que se fusionen con las de serie.
4. **Colores sólo por tokens**: `bg-background`, `text-foreground`, `bg-card`, `bg-popover`,
   `bg-muted`, `text-muted-foreground`, `border-border`, `border-input-border`, `border-input`,
   `bg-primary`, `text-primary-foreground`, `text-primary-text`, `bg-primary-soft`,
   `bg-success`, `text-success`, `bg-success-soft`, `text-warning`, `bg-warning-soft`,
   `bg-destructive`, `text-destructive-text`, `bg-ink`, `text-ink-foreground`, `bg-buy-deep`,
   `text-buy-deep-foreground`, `bg-tile`, `text-tile-foreground`, `bg-glass`, `border-glass-border`,
   `bg-overlay`, `shadow-card`, `shadow-raised`. Nada de `zinc-*`, `slate-*`, `black`, `white` ni
   hex en clases. El hover del primario es opacidad (`hover:bg-primary/80`). El texto sobre
   `bg-success` es `text-background` (no hay `--success-foreground`). Hay modo oscuro por la clase `.dark`: un token nuevo entra como variable en
   `:root` y en `.dark` de `app/globals.css` y su `--color-*` en `@theme inline`, y un componente no
   usa `dark:` salvo lo que shadcn trae de serie. Los radios son la escala explícita de
   `@theme inline`: `rounded-lg` 12 px (controles), `rounded-xl` 14 px, `rounded-2xl` 20 px
   (tarjetas y paneles), `rounded-3xl` 24 px, `rounded-4xl` 28 px y `rounded-full` (chips e
   insignias). El desenfoque va sólo en la cabecera.
5. **Contraste AA, en claro y en oscuro.** El naranja nunca es color de texto: `text-primary` está
   prohibido y se usa `text-primary-text`; el texto sobre el naranja de marca es oscuro
   (`text-primary-foreground`), nunca blanco. El texto de error usa `text-destructive-text`.
   El foco visible usa `outline-foreground`, no el primario (el naranja sobre blanco no llega a
   3:1); el `ring` y el borde de foco de luma no lo reemplazan. Un control con
   `aria-invalid` lo cambia a `outline-destructive` (sí llega a 3:1) para no mezclar negro y rojo.
   Los bordes de controles usan `border-input-border` (`--border` no llega a 3:1 sobre blanco);
   `border-border` queda para tarjetas y separadores. Los controles principales miden al menos 44 px de alto
   (`h-11`): sin los tamaños de luma bajo 44 px (`xs`, `icon-xs`, `icon-sm`). El tamaño `sm` de `Button`, `Toggle` y `SelectTrigger` mide 44 px en móvil y 36 px
   desde `md` (`h-11 md:h-9`); un control o esqueleto con altura escrita a mano sigue esa misma
   pareja. Los campos llevan `text-base` en móvil (iOS no hace zoom).
6. **Nombre accesible en todo control**; lo decorativo lleva `aria-hidden` (`Skeleton` ya lo trae).
7. **Íconos sólo de `lucide-react`**, por nombre, con `aria-hidden` en lo decorativo.
   shadcn y Radix se permiten; otra librería de componentes (Headless UI, MUI y similares) no entra
   sin aprobación de quien coordina.
8. **Tipografía.** `font-heading` (Poppins) sólo en títulos y precios, y los precios con
   `tabular-nums`; el resto hereda `font-sans` (Public Sans).

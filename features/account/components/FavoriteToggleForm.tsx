"use client";

import { useActionState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { FavoriteTarget } from "@/lib/marketplace/params";
import { INITIAL_FORM_STATE, type FormState } from "../lib/formState";
import { toggleFavorite } from "../server/accountActions";

type Props = {
  target: FavoriteTarget;
  mode: "add" | "remove";
  returnTo: string;
  children: ReactNode;
  className?: string;
  pressed?: boolean;
  ariaLabel?: string;
};

export function FavoriteToggleForm({ target, mode, returnTo, children, className, pressed, ariaLabel }: Props) {
  // El toast va dentro de la acción: en /cuenta/favoritos el refresh() quita la tarjeta y un efecto no correría.
  const [, formAction, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const next = await toggleFavorite(prev, formData);
    if (next.message !== null) {
      if (next.status === "error") toast.error(next.message);
      else if (next.status === "success") toast.success(next.message);
    }
    return next;
  }, INITIAL_FORM_STATE);

  return (
    <form action={formAction} className={className}>
      <input type="hidden" name="kind" value={target.kind} />
      <input type="hidden" name="slug" value={target.slug} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="volver" value={returnTo} />
      <Button type="submit" variant="outline" size="sm" aria-pressed={pressed} aria-label={ariaLabel} disabled={pending}>
        {children}
      </Button>
    </form>
  );
}

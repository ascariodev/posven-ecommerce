"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteAddressAction, setDefaultAddress } from "../server/accountActions";
import { INITIAL_FORM_STATE, type FormState } from "../lib/formState";

const ACTIONS = {
  default: { action: setDefaultAddress, text: "Marcar como predeterminada", ariaPrefix: "Marcar como predeterminada:" },
  delete: { action: deleteAddressAction, text: "Eliminar", ariaPrefix: "Eliminar" },
} as const;

type Props = { kind: keyof typeof ACTIONS; addressId: number; addressLabel: string };

export function AddressActionButton({ kind, addressId, addressLabel }: Props) {
  const { action, text, ariaPrefix } = ACTIONS[kind];
  // El toast se dispara aquí y no en un efecto: la respuesta trae el refresh() que quita esta tarjeta,
  // y un efecto no llegaría a correr con el componente ya desmontado.
  const [, formAction, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const next = await action(prev, formData);
    if (next.message !== null) {
      if (next.status === "error") toast.error(next.message);
      else if (next.status === "success") toast.success(next.message);
    }
    return next;
  }, INITIAL_FORM_STATE);

  return (
    <form action={formAction}>
      <input type="hidden" name="address_id" value={addressId} />
      <Button type="submit" variant="outline" size="sm" aria-label={`${ariaPrefix} ${addressLabel}`} disabled={pending}>
        {text}
      </Button>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { useFormValidation } from "@/hooks/useFormValidation";
import type { Billing } from "@/lib/marketplace/schemas";
import { clearBilling, updateBilling } from "../server/accountActions";
import { FormNotice } from "./FormFeedback";
import { BillingFields } from "./BillingFields";
import { INITIAL_FORM_STATE } from "../lib/formState";
import { billingFormSchema } from "../lib/formSchemas";

function BillingProfileFields({ billing }: { billing: Billing | null }) {
  const [actionState, formAction, pending] = useActionState(updateBilling, INITIAL_FORM_STATE);
  const { onSubmit, onChange, state } = useFormValidation(billingFormSchema, actionState);
  const [seenState, setSeenState] = useState(actionState);
  // Radix devuelve el Select al valor con que se montó cuando React resetea el formulario tras la
  // acción; montarlo de nuevo con cada respuesta le da el valor de la respuesta (L-04).
  const [responses, setResponses] = useState(0);
  if (seenState !== actionState) {
    setSeenState(actionState);
    setResponses((count) => count + 1);
  }

  return (
    <form action={formAction} onSubmit={onSubmit} onChange={onChange} noValidate className="flex flex-col gap-4">
      <FormNotice state={actionState} />
      <BillingFields state={state} billing={billing} selectKey={responses} />
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Guardar datos de facturación"}
      </Button>
    </form>
  );
}

export function BillingForm({ billing }: { billing: Billing | null }) {
  const [clearState, clearAction, clearing] = useActionState(clearBilling, INITIAL_FORM_STATE);
  const [seenState, setSeenState] = useState(clearState);
  // Los campos no escritos toman el `defaultValue` al montarse: tras borrar se montan de nuevo en blanco.
  const [clears, setClears] = useState(0);
  if (seenState !== clearState) {
    setSeenState(clearState);
    if (clearState.status === "success") setClears((count) => count + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <BillingProfileFields key={clears} billing={billing} />
      <form action={clearAction}>
        <FormNotice state={clearState} />
        <Button type="submit" variant="outline" disabled={clearing || billing === null}>
          {clearing ? "Borrando..." : "Borrar mis datos de facturación"}
        </Button>
      </form>
    </div>
  );
}

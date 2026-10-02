"use client";

import { useActionState, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormValidation } from "@/hooks/useFormValidation";
import type { Billing } from "@/lib/marketplace/schemas";
import { clearBilling, updateBilling } from "../server/accountActions";
import { FieldError, FormNotice } from "./FormFeedback";
import { INITIAL_FORM_STATE } from "../lib/formState";
import { billingFormSchema } from "../lib/formSchemas";

const DOCUMENT_TYPES = [
  { value: "V", label: "V (venezolano)" },
  { value: "E", label: "E (extranjero)" },
  { value: "J", label: "J (jurídico)" },
  { value: "G", label: "G (gubernamental)" },
];
const TAXPAYER_TYPES = [
  { value: "ordinary", label: "Ordinario" },
  { value: "special", label: "Especial" },
];

function BillingFields({ billing }: { billing: Billing | null }) {
  const [actionState, formAction, pending] = useActionState(updateBilling, INITIAL_FORM_STATE);
  const { onSubmit, onChange, state } = useFormValidation(billingFormSchema, actionState);
  const prefijo = useId();
  const [seenState, setSeenState] = useState(actionState);
  // Radix devuelve el Select al valor con que se montó cuando React resetea el formulario tras la
  // acción; montarlo de nuevo con cada respuesta le da el valor de la respuesta (L-04).
  const [responses, setResponses] = useState(0);
  if (seenState !== actionState) {
    setSeenState(actionState);
    setResponses((count) => count + 1);
  }

  const value = (name: keyof Billing): string => state.values[`billing.${name}`] ?? billing?.[name] ?? "";
  const hasError = (name: string): boolean => state.fields[`billing.${name}`] !== undefined;
  const describedBy = (name: string): string | undefined => (hasError(name) ? `${prefijo}-${name}-error` : undefined);

  function textField(name: "document" | "name" | "phone" | "address", label: string, extra: { type?: string; autoComplete?: string }) {
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={`${prefijo}-${name}`} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <Input
          id={`${prefijo}-${name}`}
          name={`billing.${name}`}
          type={extra.type ?? "text"}
          autoComplete={extra.autoComplete}
          required
          defaultValue={value(name)}
          aria-invalid={hasError(name) || undefined}
          aria-describedby={describedBy(name)}
        />
        <FieldError id={`${prefijo}-${name}-error`} state={state} name={`billing.${name}`} />
      </div>
    );
  }

  function selectField(
    name: "document_type" | "taxpayer_type",
    label: string,
    placeholder: string,
    options: { value: string; label: string }[],
  ) {
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={`${prefijo}-${name}`} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <Select key={responses} name={`billing.${name}`} required defaultValue={value(name) || undefined}>
          <SelectTrigger
            id={`${prefijo}-${name}`}
            className="w-full"
            aria-invalid={hasError(name) || undefined}
            aria-describedby={describedBy(name)}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError id={`${prefijo}-${name}-error`} state={state} name={`billing.${name}`} />
      </div>
    );
  }

  return (
    <form action={formAction} onSubmit={onSubmit} onChange={onChange} noValidate className="flex flex-col gap-4">
      <FormNotice state={actionState} />
      {selectField("document_type", "Tipo de documento", "Elige el tipo", DOCUMENT_TYPES)}
      {textField("document", "Documento", { type: "text" })}
      {textField("name", "Nombre o razón social", { autoComplete: "name" })}
      {textField("phone", "Teléfono", { type: "tel", autoComplete: "tel" })}
      {textField("address", "Dirección fiscal", { autoComplete: "street-address" })}
      {selectField("taxpayer_type", "Tipo de contribuyente", "Elige el tipo", TAXPAYER_TYPES)}
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
      <BillingFields key={clears} billing={billing} />
      <form action={clearAction}>
        <FormNotice state={clearState} />
        <Button type="submit" variant="outline" disabled={clearing || billing === null}>
          {clearing ? "Borrando..." : "Borrar mis datos de facturación"}
        </Button>
      </form>
    </div>
  );
}

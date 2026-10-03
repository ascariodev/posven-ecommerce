"use client";

import { useId } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { Billing } from "@/lib/marketplace/schemas";
import { FieldError } from "./FormFeedback";
import type { FormState } from "../lib/formState";

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

export type BillingFieldName = keyof Billing;

const ALL_FIELDS: readonly BillingFieldName[] = ["document_type", "document", "name", "phone", "address", "taxpayer_type"];

export function BillingFields({
  state,
  billing,
  fields = ALL_FIELDS,
  selectKey,
}: {
  state: FormState;
  billing: Billing | null;
  fields?: readonly BillingFieldName[];
  selectKey?: number;
}) {
  const prefijo = useId();
  const value = (name: BillingFieldName): string => state.values[`billing.${name}`] ?? billing?.[name] ?? "";
  const hasError = (name: string): boolean => state.fields[`billing.${name}`] !== undefined;
  const describedBy = (name: string): string | undefined => (hasError(name) ? `${prefijo}-${name}-error` : undefined);

  function textField(name: "document" | "name" | "phone" | "address", label: string, extra: { type?: string; autoComplete?: string }) {
    return (
      <div key={name} className="flex flex-col gap-1">
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
      <div key={name} className="flex flex-col gap-1">
        <label htmlFor={`${prefijo}-${name}`} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <Select key={selectKey} name={`billing.${name}`} required defaultValue={value(name) || undefined}>
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

  const renderers: Record<BillingFieldName, () => React.ReactNode> = {
    document_type: () => selectField("document_type", "Tipo de documento", "Elige el tipo", DOCUMENT_TYPES),
    document: () => textField("document", "Documento", { type: "text" }),
    name: () => textField("name", "Nombre o razón social", { autoComplete: "name" }),
    phone: () => textField("phone", "Teléfono", { type: "tel", autoComplete: "tel" }),
    address: () => textField("address", "Dirección fiscal", { autoComplete: "street-address" }),
    taxpayer_type: () => selectField("taxpayer_type", "Tipo de contribuyente", "Elige el tipo", TAXPAYER_TYPES),
  };

  return <>{ALL_FIELDS.filter((name) => fields.includes(name)).map((name) => renderers[name]())}</>;
}

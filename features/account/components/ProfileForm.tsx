"use client";

import { useActionState, useId } from "react";
import { useFormValidation } from "@/hooks/useFormValidation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Customer } from "@/lib/marketplace/schemas";
import { updateProfile } from "../server/accountActions";
import { FieldError, FormNotice } from "./FormFeedback";
import { INITIAL_FORM_STATE } from "../lib/formState";
import { profileSchema } from "../lib/formSchemas";

function profileInput(values: Record<string, string>): Record<string, string> {
  const input: Record<string, string> = { name: values.name ?? "", phone: values.phone ?? "" };
  if (values.email !== values.current_email) {
    input.email = values.email ?? "";
    input.current_password = values.current_password ?? "";
  }
  return input;
}

export function ProfileForm({ customer }: { customer: Customer }) {
  const [actionState, formAction, pending] = useActionState(updateProfile, INITIAL_FORM_STATE);
  const { onSubmit, state } = useFormValidation(profileSchema, actionState, profileInput);
  const prefijo = useId();
  const nameError = state.fields.name !== undefined;
  const phoneError = state.fields.phone !== undefined;
  const emailError = state.fields.email !== undefined;
  const passwordError = state.fields.current_password !== undefined;
  const currentEmail = customer.pending_email ?? customer.email;
  const helpId = `${prefijo}-current-password-help`;

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormNotice state={actionState} />
      <input type="hidden" name="current_email" value={currentEmail} />
      <div className="flex flex-col gap-1">
        <label htmlFor={`${prefijo}-name`} className="text-sm font-medium text-foreground">
          Nombre
        </label>
        <Input
          id={`${prefijo}-name`}
          name="name"
          type="text"
          autoComplete="name"
          required
          defaultValue={state.values.name ?? customer.name}
          aria-invalid={nameError || undefined}
          aria-describedby={nameError ? `${prefijo}-name-error` : undefined}
        />
        <FieldError id={`${prefijo}-name-error`} state={state} name="name" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${prefijo}-phone`} className="text-sm font-medium text-foreground">
          Teléfono
        </label>
        <Input
          id={`${prefijo}-phone`}
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          defaultValue={state.values.phone ?? customer.phone}
          aria-invalid={phoneError || undefined}
          aria-describedby={phoneError ? `${prefijo}-phone-error` : undefined}
        />
        <FieldError id={`${prefijo}-phone-error`} state={state} name="phone" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${prefijo}-email`} className="text-sm font-medium text-foreground">
          Correo
        </label>
        <Input
          id={`${prefijo}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.values.email ?? currentEmail}
          aria-invalid={emailError || undefined}
          aria-describedby={emailError ? `${prefijo}-email-error` : undefined}
        />
        <FieldError id={`${prefijo}-email-error`} state={state} name="email" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${prefijo}-current-password`} className="text-sm font-medium text-foreground">
          Contraseña actual
        </label>
        <Input
          id={`${prefijo}-current-password`}
          name="current_password"
          type="password"
          autoComplete="current-password"
          aria-invalid={passwordError || undefined}
          aria-describedby={passwordError ? `${prefijo}-current_password-error ${helpId}` : helpId}
        />
        <p id={helpId} className="text-sm text-muted-foreground">
          Sólo si cambias el correo.
        </p>
        <FieldError id={`${prefijo}-current_password-error`} state={state} name="current_password" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}

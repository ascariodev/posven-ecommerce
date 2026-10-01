"use client";

import { useActionState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { register } from "../actions";
import { FieldError, FormNotice } from "./FormFeedback";
import { INITIAL_FORM_STATE } from "../formState";

export function RegisterForm({ volver }: { volver: string }) {
  const [state, formAction, pending] = useActionState(register, INITIAL_FORM_STATE);
  const prefijo = useId();
  const nameError = state.fields.name !== undefined;
  const emailError = state.fields.email !== undefined;
  const phoneError = state.fields.phone !== undefined;
  const passwordError = state.fields.password !== undefined;
  const passwordHelpId = `${prefijo}-password-help`;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormNotice state={state} />
      <input type="hidden" name="volver" value={volver} />
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
          defaultValue={state.values.name ?? ""}
          aria-invalid={nameError || undefined}
          aria-describedby={nameError ? `${prefijo}-name-error` : undefined}
        />
        <FieldError id={`${prefijo}-name-error`} state={state} name="name" />
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
          defaultValue={state.values.email ?? ""}
          aria-invalid={emailError || undefined}
          aria-describedby={emailError ? `${prefijo}-email-error` : undefined}
        />
        <FieldError id={`${prefijo}-email-error`} state={state} name="email" />
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
          defaultValue={state.values.phone ?? ""}
          aria-invalid={phoneError || undefined}
          aria-describedby={phoneError ? `${prefijo}-phone-error` : undefined}
        />
        <FieldError id={`${prefijo}-phone-error`} state={state} name="phone" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${prefijo}-password`} className="text-sm font-medium text-foreground">
          Contraseña
        </label>
        <Input
          id={`${prefijo}-password`}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={passwordError || undefined}
          aria-describedby={passwordError ? `${passwordHelpId} ${prefijo}-password-error` : passwordHelpId}
        />
        <p id={passwordHelpId} className="text-sm text-muted-foreground">
          Al menos 8 caracteres.
        </p>
        <FieldError id={`${prefijo}-password-error`} state={state} name="password" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creando..." : "Crear cuenta"}
      </Button>
    </form>
  );
}

"use client";

import { useActionState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "../actions";
import { FieldError, FormNotice } from "./FormFeedback";
import { INITIAL_FORM_STATE } from "../formState";

export function LoginForm({ volver }: { volver: string }) {
  const [state, formAction, pending] = useActionState(login, INITIAL_FORM_STATE);
  const prefijo = useId();
  const emailError = state.fields.email !== undefined;
  const passwordError = state.fields.password !== undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormNotice state={state} />
      <input type="hidden" name="volver" value={volver} />
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
        <label htmlFor={`${prefijo}-password`} className="text-sm font-medium text-foreground">
          Contraseña
        </label>
        <Input
          id={`${prefijo}-password`}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={passwordError || undefined}
          aria-describedby={passwordError ? `${prefijo}-password-error` : undefined}
        />
        <FieldError id={`${prefijo}-password-error`} state={state} name="password" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}

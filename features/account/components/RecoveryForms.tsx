"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPassword, resetPasswordAction } from "../actions";
import { FieldError, FormNotice } from "./FormFeedback";
import { INITIAL_FORM_STATE } from "../formState";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPassword, INITIAL_FORM_STATE);
  const prefijo = useId();
  const emailError = state.fields.email !== undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormNotice state={state} />
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
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando..." : "Enviar enlace"}
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, INITIAL_FORM_STATE);
  const prefijo = useId();
  const passwordError = state.fields.password !== undefined;
  const tokenRejected = state.fields.token !== undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormNotice state={state} />
      {tokenRejected && (
        <Link href="/recuperar" className="text-sm font-medium text-foreground underline underline-offset-4">
          Pedir un enlace nuevo
        </Link>
      )}
      <input type="hidden" name="token" value={token} />
      <div className="flex flex-col gap-1">
        <label htmlFor={`${prefijo}-password`} className="text-sm font-medium text-foreground">
          Contraseña nueva
        </label>
        <Input
          id={`${prefijo}-password`}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={passwordError || undefined}
          aria-describedby={passwordError ? `${prefijo}-password-error` : undefined}
        />
        <FieldError id={`${prefijo}-password-error`} state={state} name="password" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Guardar contraseña"}
      </Button>
    </form>
  );
}

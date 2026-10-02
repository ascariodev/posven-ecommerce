"use client";

import { useActionState, useId } from "react";
import { useFormValidation } from "@/hooks/useFormValidation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePasswordAction, deleteAccountAction, updateSettingsAction } from "../server/accountActions";
import { FieldError, FormNotice } from "./FormFeedback";
import { INITIAL_FORM_STATE } from "../lib/formState";
import { changePasswordSchema, deleteAccountSchema } from "../lib/formSchemas";

export function PasswordChangeForm() {
  const [actionState, formAction, pending] = useActionState(changePasswordAction, INITIAL_FORM_STATE);
  const { onSubmit, onChange, state } = useFormValidation(changePasswordSchema, actionState);
  const prefijo = useId();
  const currentError = state.fields.current_password !== undefined;
  const newError = state.fields.password !== undefined;

  return (
    <form action={formAction} onSubmit={onSubmit} onChange={onChange} noValidate className="flex flex-col gap-4">
      <FormNotice state={actionState} />
      <div className="flex flex-col gap-1">
        <label htmlFor={`${prefijo}-current-password`} className="text-sm font-medium text-foreground">
          Contraseña actual
        </label>
        <Input
          id={`${prefijo}-current-password`}
          name="current_password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={currentError || undefined}
          aria-describedby={currentError ? `${prefijo}-current_password-error` : undefined}
        />
        <FieldError id={`${prefijo}-current_password-error`} state={state} name="current_password" />
      </div>
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
          aria-invalid={newError || undefined}
          aria-describedby={newError ? `${prefijo}-password-error` : undefined}
        />
        <FieldError id={`${prefijo}-password-error`} state={state} name="password" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Cambiando..." : "Cambiar contraseña"}
      </Button>
    </form>
  );
}

export function NotificationsForm({ enabled }: { enabled: boolean }) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, INITIAL_FORM_STATE);
  const prefijo = useId();

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormNotice state={state} />
      <div className="flex items-center gap-2">
        <input
          id={`${prefijo}-order-status-emails`}
          name="order_status_emails"
          type="checkbox"
          defaultChecked={enabled}
          className="size-4 accent-primary"
        />
        <label htmlFor={`${prefijo}-order-status-emails`} className="text-sm text-foreground">
          Avisarme por correo cuando cambie el estado de mis pedidos
        </label>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Guardar avisos"}
      </Button>
    </form>
  );
}

export function DeleteAccountForm() {
  const [actionState, formAction, pending] = useActionState(deleteAccountAction, INITIAL_FORM_STATE);
  const { onSubmit, onChange, state } = useFormValidation(deleteAccountSchema, actionState);
  const prefijo = useId();
  const passwordError = state.fields.password !== undefined;

  return (
    <form action={formAction} onSubmit={onSubmit} onChange={onChange} noValidate className="flex flex-col gap-4">
      <FormNotice state={actionState} />
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
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Eliminando..." : "Eliminar mi cuenta"}
      </Button>
    </form>
  );
}

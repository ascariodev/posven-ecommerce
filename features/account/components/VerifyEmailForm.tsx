"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { resendVerificationAction, verifyEmailAction } from "../server/actions";
import { FormNotice } from "./FormFeedback";
import { INITIAL_FORM_STATE } from "../lib/formState";

const linkClasses = "text-sm font-medium text-foreground underline underline-offset-4";

export function VerifyEmailForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(verifyEmailAction, INITIAL_FORM_STATE);

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-4">
        <FormNotice state={state} />
        <Link href="/cuenta" className={linkClasses}>
          Ir a mi cuenta
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormNotice state={state} />
      {state.status === "error" && (
        <Link href="/cuenta" className={linkClasses}>
          Pedir otro desde tu cuenta
        </Link>
      )}
      <input type="hidden" name="token" value={token} />
      <Button type="submit" disabled={pending}>
        {pending ? "Verificando..." : "Verificar mi correo"}
      </Button>
    </form>
  );
}

export function ResendVerificationForm() {
  const [state, formAction, pending] = useActionState(resendVerificationAction, INITIAL_FORM_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <FormNotice state={state} />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Enviando..." : "Reenviar verificación"}
      </Button>
    </form>
  );
}

"use client";

import { useMemo } from "react";
import { useActionToast, type ActionNotice } from "@/hooks/useActionToast";
import type { FormState } from "../lib/formState";

export function FormNotice({ state }: { state: FormState }) {
  const notice = useMemo<ActionNotice | null>(
    () => (state.status === "idle" || state.message === null ? null : { kind: state.status, message: state.message }),
    [state],
  );
  useActionToast(notice);
  return null;
}

export function FieldError({ id, state, name }: { id: string; state: FormState; name: string }) {
  const message = state.fields[name];
  if (message === undefined) return null;
  return (
    <p id={id} className="text-sm text-warning">
      {message}
    </p>
  );
}

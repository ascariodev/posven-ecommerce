"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { ZodType } from "zod";
import { formStateFromZod, type FormState } from "@/features/account/lib/formState";

function formValues(form: HTMLFormElement): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [name, value] of new FormData(form)) {
    if (typeof value === "string") values[name] = value;
  }
  return values;
}

function focusTarget(element: HTMLElement): HTMLElement {
  if (element.getAttribute("aria-hidden") === "true") {
    const trigger = element.parentElement?.querySelector<HTMLElement>('[role="combobox"]');
    if (trigger) return trigger;
  }
  return element;
}

function firstInvalidControl(form: HTMLFormElement, fields: Record<string, string>): HTMLElement | null {
  for (const element of Array.from(form.elements)) {
    if (element instanceof HTMLElement && "name" in element && typeof element.name === "string" && element.name in fields) {
      return focusTarget(element);
    }
  }
  return null;
}

export function useFormValidation(
  schema: ZodType,
  state: FormState,
  prepare?: (values: Record<string, string>) => Record<string, string>,
) {
  const [clientFields, setClientFields] = useState<Record<string, string>>({});
  const pendingFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    pendingFocus.current?.focus();
    pendingFocus.current = null;
  }, [clientFields]);

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      const values = formValues(event.currentTarget);
      const result = schema.safeParse(prepare ? prepare(values) : values);
      if (result.success) {
        setClientFields({});
        return;
      }
      event.preventDefault();
      const fields = formStateFromZod(result.error, values).fields;
      pendingFocus.current = firstInvalidControl(event.currentTarget, fields);
      setClientFields(fields);
    },
    [schema, prepare],
  );

  const view = useMemo<FormState>(
    () => ({ ...state, fields: { ...state.fields, ...clientFields } }),
    [state, clientFields],
  );

  return { onSubmit, state: view };
}

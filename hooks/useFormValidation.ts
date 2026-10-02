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

const NO_NAMES: ReadonlySet<string> = new Set();

function isNamedControl(target: EventTarget): target is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return (
    target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement
  );
}

export function useFormValidation(
  schema: ZodType,
  state: FormState,
  prepare?: (values: Record<string, string>) => Record<string, string>,
) {
  const [clientFields, setClientFields] = useState<Record<string, string>>({});
  // Atado a la respuesta que lo originó: una respuesta nueva del servidor vuelve a mostrar todos sus errores.
  const [dismissed, setDismissed] = useState<{ source: FormState; names: ReadonlySet<string> }>({
    source: state,
    names: NO_NAMES,
  });
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

  // Al corregir, un error del cliente se quita o se actualiza, pero escribir no muestra errores en
  // campos que no los tenían. Uno del servidor se quita sólo en el campo editado, porque el esquema
  // no sabe, por ejemplo, si el correo ya está registrado.
  const onChange = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      const target = event.target;
      if (!isNamedControl(target) || target.name === "") return;
      const values = formValues(event.currentTarget);
      const result = schema.safeParse(prepare ? prepare(values) : values);
      const invalid = result.success ? {} : formStateFromZod(result.error, values).fields;
      setClientFields((fields) => {
        const kept = Object.keys(fields)
          .filter((name) => name in invalid)
          .map((name) => [name, invalid[name]] as const);
        const unchanged =
          kept.length === Object.keys(fields).length && kept.every(([name, message]) => fields[name] === message);
        return unchanged ? fields : Object.fromEntries(kept);
      });
      if (target.name in state.fields && !(target.name in invalid)) {
        setDismissed((current) => {
          const names = current.source === state ? current.names : NO_NAMES;
          return names.has(target.name) ? current : { source: state, names: new Set([...names, target.name]) };
        });
      }
    },
    [schema, prepare, state],
  );

  const view = useMemo<FormState>(() => {
    const dismissedNames = dismissed.source === state ? dismissed.names : NO_NAMES;
    const serverFields = Object.fromEntries(
      Object.entries(state.fields).filter(([name]) => !dismissedNames.has(name)),
    );
    return { ...state, fields: { ...serverFields, ...clientFields } };
  }, [state, clientFields, dismissed]);

  return { onSubmit, onChange, state: view };
}

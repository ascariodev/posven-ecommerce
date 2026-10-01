import type { FormState } from "../formState";

export function FormNotice({ state }: { state: FormState }) {
  if (state.status === "idle" || state.message === null) return null;
  if (state.status === "error") {
    return (
      <p role="alert" className="text-sm text-warning">
        {state.message}
      </p>
    );
  }
  return (
    <p role="status" className="text-sm text-foreground">
      {state.message}
    </p>
  );
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

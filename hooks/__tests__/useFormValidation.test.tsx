import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useActionState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useFormValidation } from "@/hooks/useFormValidation";
import { loginSchema } from "@/features/account/lib/formSchemas";
import { INITIAL_FORM_STATE, type FormState } from "@/features/account/lib/formState";

const action = vi.fn(async (): Promise<FormState> => ({
  ...INITIAL_FORM_STATE,
  status: "error",
  message: "No",
  fields: { email: "Del servidor" },
}));

function LoginProbe() {
  const [actionState, formAction] = useActionState(action, INITIAL_FORM_STATE);
  const { onSubmit, state } = useFormValidation(loginSchema, actionState);
  return (
    <form action={formAction} onSubmit={onSubmit} noValidate aria-label="login">
      <input name="email" aria-label="email" aria-invalid={state.fields.email ? true : undefined} />
      <input name="password" type="password" aria-label="password" aria-invalid={state.fields.password ? true : undefined} />
      <p data-testid="email-error">{state.fields.email ?? ""}</p>
      <p data-testid="password-error">{state.fields.password ?? ""}</p>
      <button type="submit">Enviar</button>
    </form>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useFormValidation", () => {
  it("cancela el envío y muestra los errores si el esquema falla", async () => {
    render(<LoginProbe />);
    await act(async () => {
      fireEvent.submit(screen.getByRole("form", { name: "login" }));
    });
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByTestId("email-error").textContent).not.toBe("");
    expect(screen.getByTestId("password-error").textContent).not.toBe("");
  });

  it("mueve el foco al primer campo inválido, ya con aria-invalid", async () => {
    render(<LoginProbe />);
    await act(async () => {
      fireEvent.submit(screen.getByRole("form", { name: "login" }));
    });
    const email = screen.getByLabelText("email");
    expect(document.activeElement).toBe(email);
    expect(email.getAttribute("aria-invalid")).toBe("true");

    fireEvent.change(email, { target: { value: "a@b.co" } });
    await act(async () => {
      fireEvent.submit(screen.getByRole("form", { name: "login" }));
    });
    expect(document.activeElement).toBe(screen.getByLabelText("password"));
  });

  it("deja pasar un envío válido a la acción y limpia los errores del cliente", async () => {
    render(<LoginProbe />);
    await act(async () => {
      fireEvent.submit(screen.getByRole("form", { name: "login" }));
    });
    fireEvent.change(screen.getByLabelText("email"), { target: { value: "a@b.co" } });
    fireEvent.change(screen.getByLabelText("password"), { target: { value: "secreto" } });
    await act(async () => {
      fireEvent.submit(screen.getByRole("form", { name: "login" }));
    });
    expect(action).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("password-error").textContent).toBe("");
    expect(screen.getByTestId("email-error").textContent).toBe("Del servidor");
  });
});

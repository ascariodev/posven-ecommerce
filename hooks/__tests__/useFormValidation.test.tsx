import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useActionState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useFormValidation } from "@/hooks/useFormValidation";
import { addressSchema, loginSchema, profileSchema } from "@/features/account/lib/formSchemas";
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

function profileInput(values: Record<string, string>): Record<string, string> {
  const input: Record<string, string> = { name: values.name ?? "", phone: values.phone ?? "" };
  if (values.email !== values.current_email) {
    input.email = values.email ?? "";
    input.current_password = values.current_password ?? "";
  }
  return input;
}

function ProfileProbe() {
  const [actionState, formAction] = useActionState(action, INITIAL_FORM_STATE);
  const { onSubmit, state } = useFormValidation(profileSchema, actionState, profileInput);
  return (
    <form action={formAction} onSubmit={onSubmit} noValidate aria-label="perfil">
      <input name="current_email" type="hidden" defaultValue="a@b.co" />
      <input name="name" defaultValue="Ana" aria-label="name" />
      <input name="phone" defaultValue="04141234567" aria-label="phone" />
      <input name="email" defaultValue="a@b.co" aria-label="email" />
      <input name="current_password" type="password" aria-label="current_password" />
      <p data-testid="email-error">{state.fields.email ?? ""}</p>
      <button type="submit">Enviar</button>
    </form>
  );
}

function CityProbe() {
  const [actionState, formAction] = useActionState(action, INITIAL_FORM_STATE);
  const { onSubmit } = useFormValidation(addressSchema, actionState);
  return (
    <form action={formAction} onSubmit={onSubmit} noValidate aria-label="direccion">
      <input name="label" defaultValue="Casa" aria-label="label" />
      <input name="recipient_name" defaultValue="Ana" aria-label="recipient_name" />
      <input name="phone" defaultValue="04141234567" aria-label="phone" />
      <div>
        <button type="button" role="combobox" aria-label="ciudad" aria-expanded="false" aria-controls="x" />
        <select name="city_slug" aria-hidden="true" tabIndex={-1} defaultValue="" />
      </div>
      <input name="line" defaultValue="Calle 1" aria-label="line" />
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

  it("con transformación, sólo valida el correo si cambió", async () => {
    render(<ProfileProbe />);
    await act(async () => {
      fireEvent.submit(screen.getByRole("form", { name: "perfil" }));
    });
    expect(action).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText("email"), { target: { value: "sin-arroba" } });
    await act(async () => {
      fireEvent.submit(screen.getByRole("form", { name: "perfil" }));
    });
    expect(action).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("email-error").textContent).not.toBe("");
    expect(document.activeElement).toBe(screen.getByLabelText("email"));
  });

  it("enfoca el disparador del Select cuando el control con nombre está oculto", async () => {
    render(<CityProbe />);
    await act(async () => {
      fireEvent.submit(screen.getByRole("form", { name: "direccion" }));
    });
    expect(action).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByRole("combobox", { name: "ciudad" }));
  });
});

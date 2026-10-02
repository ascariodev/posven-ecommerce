import { cleanup, render } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { useActionToast, type ActionNotice } from "@/hooks/useActionToast";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

function Probe({ notice }: { notice: ActionNotice | null }) {
  useActionToast(notice);
  return null;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useActionToast", () => {
  it("no dispara nada con null", () => {
    render(<Probe notice={null} />);
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("dispara un toast del tipo correcto, uno solo bajo StrictMode", () => {
    render(
      <StrictMode>
        <Probe notice={{ kind: "error", message: "Falló" }} />
      </StrictMode>,
    );
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith("Falló");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("dispara uno por cada objeto de estado nuevo, aunque el mensaje se repita", () => {
    const first: ActionNotice = { kind: "success", message: "Listo" };
    const { rerender } = render(<Probe notice={first} />);
    rerender(<Probe notice={first} />);
    expect(toast.success).toHaveBeenCalledTimes(1);
    rerender(<Probe notice={{ kind: "success", message: "Listo" }} />);
    expect(toast.success).toHaveBeenCalledTimes(2);
  });
});

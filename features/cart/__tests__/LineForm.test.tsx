import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AddToCartState } from "@/features/cart/lib/addToCartState";
import { LineForm } from "@/features/cart/components/LineForm";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderForm(action: (prev: AddToCartState, formData: FormData) => Promise<AddToCartState>) {
  render(
    <LineForm action={action} storeSlug="farmacia-central-valencia" productSlug="acetaminofen" quantity={3}>
      <button type="submit">Enviar</button>
    </LineForm>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
}

describe("LineForm", () => {
  it("envía la referencia y la cantidad, y un error sale por toast", async () => {
    const action = vi.fn().mockResolvedValue({ status: "error", message: "Esta tienda no vende este producto en línea." });
    renderForm(action);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Esta tienda no vende este producto en línea."));
    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("store_slug")).toBe("farmacia-central-valencia");
    expect(formData.get("product_slug")).toBe("acetaminofen");
    expect(formData.get("quantity")).toBe("3");
  });

  it("un cambio exitoso no abre toast", async () => {
    const action = vi.fn().mockResolvedValue({ status: "added", message: null });
    renderForm(action);

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});

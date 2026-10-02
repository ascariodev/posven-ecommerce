import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";
import { deleteAddressAction, setDefaultAddress } from "@/features/account/server/accountActions";
import type { FormState } from "../lib/formState";
import { AddressActionButton } from "../components/AddressActionButton";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/features/account/server/accountActions", () => ({
  deleteAddressAction: vi.fn(),
  setDefaultAddress: vi.fn(),
}));

function result(status: "success" | "error", message: string): FormState {
  return { status, message, fields: {}, values: {} };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AddressActionButton", () => {
  it("eliminar envía address_id y avisa el éxito con un toast", async () => {
    vi.mocked(deleteAddressAction).mockResolvedValue(result("success", "Eliminamos la dirección."));
    render(<AddressActionButton kind="delete" addressId={7} addressLabel="Casa" />);

    fireEvent.click(screen.getByRole("button", { name: "Eliminar Casa" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Eliminamos la dirección."));
    const formData = vi.mocked(deleteAddressAction).mock.calls[0][1];
    expect(formData.get("address_id")).toBe("7");
  });

  it("not_found se avisa como error en un toast", async () => {
    vi.mocked(setDefaultAddress).mockResolvedValue(result("error", "No encontrado."));
    render(<AddressActionButton kind="default" addressId={7} addressLabel="Casa" />);

    fireEvent.click(screen.getByRole("button", { name: "Marcar como predeterminada: Casa" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No encontrado."));
    expect(toast.success).not.toHaveBeenCalled();
  });
});

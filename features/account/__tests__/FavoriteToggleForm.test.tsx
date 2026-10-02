import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toggleFavorite } from "@/features/account/server/accountActions";
import type { FormState } from "../lib/formState";
import { FavoriteToggleForm } from "../components/FavoriteToggleForm";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/features/account/server/accountActions", () => ({ toggleFavorite: vi.fn() }));

function result(status: "success" | "error", message: string): FormState {
  return { status, message, fields: {}, values: {} };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FavoriteToggleForm", () => {
  it("envía kind, slug, mode y volver y avisa el éxito en un toast", async () => {
    vi.mocked(toggleFavorite).mockResolvedValue(result("success", "Guardamos el favorito."));
    render(
      <FavoriteToggleForm target={{ kind: "product", slug: "acetaminofen" }} mode="add" returnTo="/p/acetaminofen" pressed={false}>
        Guardar en favoritos
      </FavoriteToggleForm>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Guardar en favoritos" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Guardamos el favorito."));
    const formData = vi.mocked(toggleFavorite).mock.calls[0][1];
    expect(Object.fromEntries(formData.entries())).toEqual({
      kind: "product",
      slug: "acetaminofen",
      mode: "add",
      volver: "/p/acetaminofen",
    });
  });

  it("un error se avisa como error en un toast", async () => {
    vi.mocked(toggleFavorite).mockResolvedValue(result("error", "No encontrado."));
    render(
      <FavoriteToggleForm target={{ kind: "store", slug: "t" }} mode="remove" returnTo="/cuenta/favoritos" ariaLabel="Quitar T de favoritos">
        Quitar
      </FavoriteToggleForm>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Quitar T de favoritos" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No encontrado."));
    expect(toast.success).not.toHaveBeenCalled();
  });
});

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HelpCenter } from "@/features/help/components/HelpCenter";
import { HELP_QUESTIONS } from "@/features/help/lib/content";

afterEach(cleanup);

function type(value: string) {
  fireEvent.change(screen.getByRole("searchbox", { name: "Buscar en la ayuda" }), {
    target: { value },
  });
}

describe("HelpCenter", () => {
  it("lista todas las preguntas sin filtro", () => {
    render(<HelpCenter />);
    expect(screen.getAllByRole("group")).toHaveLength(HELP_QUESTIONS.length);
  });

  it("filtra por el texto escrito (RN-HELP-03)", () => {
    render(<HelpCenter />);
    type("factura");
    expect(screen.getByText("¿Cómo pido la factura a mi nombre?")).toBeTruthy();
    expect(screen.queryByText("¿Cómo retiro mi pedido?")).toBeNull();
  });

  it("sin coincidencias muestra el estado vacío (RN-HELP-04)", () => {
    render(<HelpCenter />);
    type("zzzzzz");
    expect(screen.getByRole("heading", { name: "Sin coincidencias" })).toBeTruthy();
    expect(screen.queryAllByRole("group")).toHaveLength(0);
  });
});

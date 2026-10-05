import { cleanup, render, screen } from "@testing-library/react";
import { SearchX } from "lucide-react";
import { afterEach, describe, expect, it } from "vitest";
import { EmptyState } from "@/components/EmptyState";

afterEach(cleanup);

describe("EmptyState", () => {
  it("pinta el título como h2 por defecto, el texto y las acciones", () => {
    render(
      <EmptyState icon={SearchX} title="Nada por aquí" description="Prueba otra cosa.">
        <a href="/">Ir al inicio</a>
      </EmptyState>,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Nada por aquí" })).toBeTruthy();
    expect(screen.getByText("Prueba otra cosa.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toBeTruthy();
  });

  it("usa h1 cuando es la página entera y oculta el ícono", () => {
    const { container } = render(<EmptyState icon={SearchX} title="404" headingLevel="h1" />);
    expect(screen.getByRole("heading", { level: 1, name: "404" })).toBeTruthy();
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("usa h3 dentro de una sección con su propio h2", () => {
    render(<EmptyState icon={SearchX} title="Sin ofertas" headingLevel="h3" />);
    expect(screen.getByRole("heading", { level: 3, name: "Sin ofertas" })).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
  });

  it("sin texto ni acciones no deja contenedores vacíos", () => {
    const { container } = render(<EmptyState icon={SearchX} title="Vacío" />);
    expect(container.querySelector("p")).toBeNull();
    expect(container.querySelectorAll("div").length).toBe(2);
  });
});

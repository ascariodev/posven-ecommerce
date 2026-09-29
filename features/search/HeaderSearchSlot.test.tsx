import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HeaderSearchSlot } from "./HeaderSearchSlot";

const usePathname = vi.hoisted(() => vi.fn<() => string>());

vi.mock("next/navigation", () => ({ usePathname }));

afterEach(() => {
  cleanup();
  usePathname.mockReset();
});

function renderAt(pathname: string) {
  usePathname.mockReturnValue(pathname);
  render(
    <HeaderSearchSlot>
      <p>contenido del slot</p>
    </HeaderSearchSlot>,
  );
}

describe("HeaderSearchSlot", () => {
  it("en la portada no pinta sus hijos", () => {
    renderAt("/");
    expect(screen.queryByText("contenido del slot")).toBeNull();
  });

  it("en /buscar no pinta sus hijos", () => {
    renderAt("/buscar");
    expect(screen.queryByText("contenido del slot")).toBeNull();
  });

  it("en la ficha de un producto pinta sus hijos", () => {
    renderAt("/p/acetaminofen-500-mg-20-tabletas");
    expect(screen.getByText("contenido del slot")).toBeTruthy();
  });
});

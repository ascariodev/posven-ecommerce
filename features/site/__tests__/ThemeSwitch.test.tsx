import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeSwitch } from "@/features/site/components/ThemeSwitch";

const setTheme = vi.fn();
let resolvedTheme = "light";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme, setTheme }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  resolvedTheme = "light";
});

describe("ThemeSwitch", () => {
  it("refleja el tema resuelto en aria-checked", () => {
    resolvedTheme = "dark";
    render(<ThemeSwitch />);
    expect(screen.getByRole("switch", { name: "Modo oscuro" }).getAttribute("aria-checked")).toBe("true");
  });

  it("fija dark al activarlo y light al apagarlo", () => {
    const { rerender } = render(<ThemeSwitch />);
    fireEvent.click(screen.getByRole("switch", { name: "Modo oscuro" }));
    expect(setTheme).toHaveBeenLastCalledWith("dark");

    resolvedTheme = "dark";
    rerender(<ThemeSwitch />);
    fireEvent.click(screen.getByRole("switch", { name: "Modo oscuro" }));
    expect(setTheme).toHaveBeenLastCalledWith("light");
  });

  it("antes de hidratar pinta aria-checked en false aunque el tema resuelto sea dark", () => {
    resolvedTheme = "dark";
    const html = renderToString(<ThemeSwitch />);
    expect(html).toContain('aria-checked="false"');
    expect(html).not.toContain('aria-checked="true"');
  });
});

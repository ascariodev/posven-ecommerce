import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchBox } from "@/features/search/components/SearchBox";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const RESPONSE = {
  terms: ["Acetaminofén 500 mg"],
  products: [
    {
      slug: "acetaminofen-500",
      name: "Acetaminofén 500 mg 20 tabletas",
      ean: null,
      brand: null,
      category: null,
      image_url: null,
      attributes: [],
      restriction: "none",
      is_unified: true,
      offers_count: 1,
      min_price_usd: "1.50",
      min_price_ves: "54.75",
      nearest_km: 1,
      outside_radius: false,
    },
  ],
  categories: [{ slug: "analgesicos", name: "Analgésicos" }],
  rate: { usd_ves: "36.50", valid_on: "2026-09-26" },
};

const fetchMock = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  push.mockReset();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve(RESPONSE) });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function typeQuery(value: string) {
  const input = screen.getByRole("combobox", { name: "Buscar productos" });
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
  return input;
}

describe("SearchBox", () => {
  it("con 2 letras o más pide sugerencias y las muestra con el precio tal como llega", async () => {
    render(<SearchBox />);
    const input = await typeQuery("acet");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/api/suggestions?q=acet");
    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(screen.getByRole("option", { name: /Acetaminofén 500 mg 20 tabletas/ }).textContent).toContain("$ 1,50");
    expect(screen.getByRole("option", { name: "acet en Analgésicos" })).toBeTruthy();
  });

  it("con una letra no llama a la API", async () => {
    render(<SearchBox />);
    await typeQuery("a");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("flechas y Enter eligen la opción activa y la llevan a su enlace; Escape cierra", async () => {
    render(<SearchBox />);
    const input = await typeQuery("acet");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const first = screen.getByRole("option", { name: "Acetaminofén 500 mg" });
    expect(first.getAttribute("aria-selected")).toBe("true");
    expect(input.getAttribute("aria-activedescendant")).toBe(first.id);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(push).toHaveBeenCalledWith("/buscar?q=Acetaminof%C3%A9n+500+mg");
    expect(JSON.parse(window.localStorage.getItem("recent-searches") ?? "[]")).toEqual(["Acetaminofén 500 mg"]);

    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("sin texto ofrece los recientes guardados", () => {
    window.localStorage.setItem("recent-searches", JSON.stringify(["leche en polvo"]));
    render(<SearchBox />);
    fireEvent.focus(screen.getByRole("combobox", { name: "Buscar productos" }));
    expect(screen.getByRole("option", { name: "leche en polvo" })).toBeTruthy();
  });

  it("si la API falla no muestra panel", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: () => Promise.resolve({}) });
    render(<SearchBox />);
    await typeQuery("acet");
    expect(screen.queryByRole("listbox")).toBeNull();
  });
  it("si el panel se encoge con una opción activa, Enter no falla ni apunta a un id inexistente", async () => {
    render(<SearchBox />);
    const input = await typeQuery("acet");
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ...RESPONSE, products: [], categories: [] }),
    });
    fireEvent.change(input, { target: { value: "acetx" } });
    for (let n = 0; n < 3; n += 1) fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).not.toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(input.getAttribute("aria-activedescendant")).toBeNull();
    expect(() => fireEvent.keyDown(input, { key: "Enter" })).not.toThrow();
    expect(push).not.toHaveBeenCalled();
  });

  it("ArrowDown con el panel cerrado lo abre y deja activa la primera opción", async () => {
    render(<SearchBox />);
    const input = await typeQuery("acet");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const first = screen.getAllByRole("option")[0];
    expect(first.getAttribute("aria-selected")).toBe("true");
    expect(input.getAttribute("aria-activedescendant")).toBe(first.id);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getAllByRole("option")[1].getAttribute("aria-selected")).toBe("true");
  });

  it("ArrowUp con la lista vacía limpia la marca que dejó ArrowDown", async () => {
    render(<SearchBox defaultQuery="acet" />);
    const input = screen.getByRole("combobox", { name: "Buscar productos" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(input.getAttribute("aria-activedescendant")).toBeNull();
  });

  it("Borrar recientes vacía el panel sin ser opción, conserva el foco del input y limpia el almacenamiento", () => {
    window.localStorage.setItem("recent-searches", JSON.stringify(["leche en polvo", "harina"]));
    render(<SearchBox />);
    const input = screen.getByRole("combobox", { name: "Buscar productos" });
    input.focus();
    fireEvent.focus(input);
    expect(screen.getAllByRole("option")).toHaveLength(2);
    const clear = screen.getByRole("button", { name: "Borrar historial" });
    expect(screen.getByRole("listbox").contains(clear)).toBe(false);
    expect(fireEvent.mouseDown(clear)).toBe(false);
    fireEvent.click(clear);
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.queryByRole("button", { name: "Borrar historial" })).toBeNull();
    expect(window.localStorage.getItem("recent-searches")).toBeNull();
    expect(document.activeElement).toBe(input);
  });
});

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { searchProducts } from "@/lib/marketplace/client";
import { SearchResults } from "./SearchResults";

vi.mock("@/lib/marketplace/client", () => ({
  searchProducts: vi.fn(),
  listCategories: vi.fn(async () => []),
  listLocations: vi.fn(async () => []),
}));

vi.mock("@/features/location/server", () => ({
  getUserLocation: vi.fn(async () => null),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SearchResults", () => {
  it("sin q ni categoría pide escribir y no llama a searchProducts", async () => {
    render(await SearchResults({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Escribe qué buscas o elige una categoría.")).toBeTruthy();
    expect(searchProducts).not.toHaveBeenCalled();
  });
});

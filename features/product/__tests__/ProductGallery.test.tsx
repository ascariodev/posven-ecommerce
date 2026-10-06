import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProductGallery } from "@/features/product/components/ProductGallery";

afterEach(() => {
  cleanup();
});

describe("ProductGallery", () => {
  it("con una sola imagen la pinta una vez y sin miniaturas", () => {
    render(<ProductGallery images={["https://cdn.test/a.jpg"]} alt="Acetaminofén" />);

    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("con varias imágenes pinta una miniatura por imagen", () => {
    render(<ProductGallery images={["https://cdn.test/a.jpg", "https://cdn.test/b.jpg"]} alt="Acetaminofén" />);

    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("sin imágenes pinta el marcador sin imágenes inventadas", () => {
    render(<ProductGallery images={[]} alt="Acetaminofén" />);

    expect(screen.getByRole("img", { name: "Acetaminofén - Sin imagen" })).toBeTruthy();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(document.querySelector("img")).toBeNull();
  });
});

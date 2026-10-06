import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OutOfRangeNotice } from "@/features/location/components/OutOfRangeNotice";

afterEach(cleanup);

describe("OutOfRangeNotice", () => {
  it("nombra la ciudad cuando la hay", () => {
    render(<OutOfRangeNotice cityName="Maracaibo" />);
    expect(screen.getByRole("status").textContent).toContain("fuera del rango de Maracaibo");
  });

  it("sin ciudad usa el aviso genérico", () => {
    render(<OutOfRangeNotice cityName={null} />);
    expect(screen.getByRole("status").textContent).toContain("fuera de tu rango");
  });
});

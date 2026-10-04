import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EventInput } from "@/lib/marketplace/schemas";
import { sendBeaconEvent } from "@/features/events/lib/beacon";
import { ViewBeacon } from "@/features/events/components/ViewBeacon";

vi.mock("@/features/events/lib/beacon", () => ({ sendBeaconEvent: vi.fn() }));

const search: EventInput = { type: "search", store_slug: null, product_slug: null, query: "paracetamol", results_count: 12 };

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ViewBeacon", () => {
  it("un rerender con el mismo evento no lo reenvía", () => {
    const { rerender } = render(<ViewBeacon event={{ ...search }} />);
    rerender(<ViewBeacon event={{ ...search }} />);
    expect(sendBeaconEvent).toHaveBeenCalledTimes(1);
  });

  it("un rerender con otra referencia y los mismos campos de evento (cambio de orden) no lo reenvía", () => {
    const { rerender } = render(<ViewBeacon event={{ ...search }} />);
    rerender(<ViewBeacon event={{ ...search, orden: "price_asc" } as EventInput} />);
    expect(sendBeaconEvent).toHaveBeenCalledTimes(1);
  });

  it("otro query o otro results_count lo reenvía una vez más cada uno", () => {
    const { rerender } = render(<ViewBeacon event={{ ...search }} />);
    rerender(<ViewBeacon event={{ ...search, query: "ibuprofeno" }} />);
    expect(sendBeaconEvent).toHaveBeenCalledTimes(2);
    rerender(<ViewBeacon event={{ ...search, query: "ibuprofeno", results_count: 3 }} />);
    expect(sendBeaconEvent).toHaveBeenCalledTimes(3);
  });
});

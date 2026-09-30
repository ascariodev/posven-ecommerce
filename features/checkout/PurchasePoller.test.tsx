import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PurchasePoller } from "./PurchasePoller";

const refresh = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  refresh.mockReset();
});

describe("PurchasePoller", () => {
  it("refresca cada 3 segundos", () => {
    render(<PurchasePoller href="/checkout/resultado?compra=PV-00000A" />);

    vi.advanceTimersByTime(2999);
    expect(refresh).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(3000);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("deja de refrescar al desmontarse", () => {
    const { unmount } = render(<PurchasePoller href="/checkout/resultado?compra=PV-00000A" />);

    unmount();
    vi.advanceTimersByTime(9000);

    expect(refresh).not.toHaveBeenCalled();
  });
});

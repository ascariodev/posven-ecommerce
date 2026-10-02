import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PurchasePoller } from "@/features/checkout/components/PurchasePoller";

const refresh = vi.hoisted(() => vi.fn());

const router = vi.hoisted(() => ({ refresh }));

vi.mock("next/navigation", () => ({ useRouter: () => router }));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  refresh.mockReset();
});

const HREF = "/checkout/resultado?compra=PV-00000A";

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, value: hidden });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("PurchasePoller", () => {
  afterEach(() => setHidden(false));

  it("refresca a los 3 s, a los 5 s siguientes y luego cada 10 s", () => {
    render(<PurchasePoller href={HREF} />);

    vi.advanceTimersByTime(2999);
    expect(refresh).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(4999);
    expect(refresh).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(refresh).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(9999);
    expect(refresh).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1);
    expect(refresh).toHaveBeenCalledTimes(3);
    vi.advanceTimersByTime(10000);
    expect(refresh).toHaveBeenCalledTimes(4);
  });

  it("se detiene a los 2 minutos y deja Consultar de nuevo", () => {
    render(<PurchasePoller href={HREF} />);

    act(() => {
      vi.advanceTimersByTime(120000);
    });
    const calls = refresh.mock.calls.length;
    vi.advanceTimersByTime(60000);

    expect(refresh).toHaveBeenCalledTimes(calls);
    expect(screen.getByText("Seguimos esperando la confirmación del pago.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Consultar de nuevo" }).getAttribute("href")).toBe(HREF);
  });

  it("pausa con la pestaña oculta y retoma al volver", () => {
    render(<PurchasePoller href={HREF} />);

    setHidden(true);
    vi.advanceTimersByTime(60000);
    expect(refresh).not.toHaveBeenCalled();

    setHidden(false);
    vi.advanceTimersByTime(3000);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("deja de refrescar al desmontarse", () => {
    const { unmount } = render(<PurchasePoller href={HREF} />);

    unmount();
    vi.advanceTimersByTime(30000);

    expect(refresh).not.toHaveBeenCalled();
  });
});

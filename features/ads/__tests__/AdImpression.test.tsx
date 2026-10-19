import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendBeaconEvent } from "@/features/events/lib/beacon";
import { AdImpression } from "../components/AdImpression";

vi.mock("@/features/events/lib/beacon", () => ({ sendBeaconEvent: vi.fn() }));

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;
let callback: Callback;
let thresholds: number | number[] | undefined;
const disconnect = vi.fn();

function see(ratio: number) {
  act(() => callback([{ isIntersecting: ratio > 0, intersectionRatio: ratio }]));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: Callback, options?: IntersectionObserverInit) {
        callback = cb;
        thresholds = options?.threshold;
      }
      observe = vi.fn();
      disconnect = disconnect;
    },
  );
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("AdImpression", () => {
  it("manda ad_impression tras un segundo con al menos la mitad visible, una sola vez", () => {
    render(<AdImpression token="tok">x</AdImpression>);
    expect(thresholds).toBe(0.5);
    see(0.6);
    act(() => vi.advanceTimersByTime(999));
    expect(sendBeaconEvent).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(sendBeaconEvent).toHaveBeenCalledWith({ type: "ad_impression", ad_token: "tok" });
    see(1);
    act(() => vi.advanceTimersByTime(5000));
    expect(sendBeaconEvent).toHaveBeenCalledTimes(1);
  });

  it("no cuenta si sale de la vista antes del segundo o si ve menos de la mitad", () => {
    render(<AdImpression token="tok">x</AdImpression>);
    see(0.4);
    act(() => vi.advanceTimersByTime(2000));
    see(0.7);
    act(() => vi.advanceTimersByTime(600));
    see(0);
    act(() => vi.advanceTimersByTime(2000));
    expect(sendBeaconEvent).not.toHaveBeenCalled();
  });

  it("al desmontar cancela el temporizador", () => {
    const { unmount } = render(<AdImpression token="tok">x</AdImpression>);
    see(1);
    unmount();
    act(() => vi.advanceTimersByTime(2000));
    expect(sendBeaconEvent).not.toHaveBeenCalled();
  });
});

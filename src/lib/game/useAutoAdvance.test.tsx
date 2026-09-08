import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useAutoAdvance, ADVANCE_RETRY_BASE_MS, ADVANCE_RETRY_MAX_MS } from "./useGameClock";
import { requestAdvance } from "./actions";

/** Drain the microtask queue between fake-timer steps: every retry is armed
 * from inside a promise continuation, so advancing timers alone is not enough. */
async function tick(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

const PHASE = { name: "NIGHT", version: 1, endsAt: 10_000 };

describe("useAutoAdvance", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    // Deterministic jitter: 0ms of spread, so every deadline is exact.
    vi.spyOn(Math, "random").mockReturnValue(0);
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const ok = () => ({ ok: true, status: 200 });
  const serverError = () => ({ ok: false, status: 500 });

  it("calls advance once when the clock crosses endsAt and the server accepts", async () => {
    fetchMock.mockResolvedValue(ok());
    renderHook(() => useAutoAdvance("g1", PHASE, 0));

    await tick(9_999);
    expect(fetchMock).not.toHaveBeenCalled();

    await tick(1);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/games/g1/advance", {
      method: "POST",
    });

    // A success must not schedule anything further — the phase change re-arms.
    await tick(ADVANCE_RETRY_MAX_MS * 4);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries after a 500, which fetch resolves rather than rejects", async () => {
    fetchMock.mockResolvedValue(serverError());
    renderHook(() => useAutoAdvance("g1", PHASE, 0));

    await tick(10_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await tick(ADVANCE_RETRY_BASE_MS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries after a transport failure", async () => {
    fetchMock.mockRejectedValue(new Error("Failed to fetch"));
    renderHook(() => useAutoAdvance("g1", PHASE, 0));

    await tick(10_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await tick(ADVANCE_RETRY_BASE_MS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("backs off exponentially and caps, then stops as soon as one call lands", async () => {
    fetchMock.mockResolvedValue(serverError());
    renderHook(() => useAutoAdvance("g1", PHASE, 0));

    await tick(10_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    for (const expected of [1_000, 2_000, 4_000, 8_000, 15_000, 15_000]) {
      const before = fetchMock.mock.calls.length;
      await tick(expected - 1);
      expect(fetchMock).toHaveBeenCalledTimes(before);
      await tick(1);
      expect(fetchMock).toHaveBeenCalledTimes(before + 1);
    }

    fetchMock.mockResolvedValue(ok());
    const before = fetchMock.mock.calls.length;
    await tick(ADVANCE_RETRY_MAX_MS);
    expect(fetchMock).toHaveBeenCalledTimes(before + 1);

    await tick(ADVANCE_RETRY_MAX_MS * 4);
    expect(fetchMock).toHaveBeenCalledTimes(before + 1);
  });

  it("stops retrying once the phase instance changes", async () => {
    fetchMock.mockResolvedValue(serverError());
    const { rerender } = renderHook(({ phase }) => useAutoAdvance("g1", phase, 0), {
      initialProps: { phase: PHASE },
    });

    await tick(10_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // The server advanced on some other client's call: the old instance's
    // pending retry is dropped. The replacement's own deadline is far outside
    // the window below, so any call here could only come from the dead timer.
    rerender({ phase: { name: "DAY", version: 2, endsAt: 10_000_000 } });
    await tick(ADVANCE_RETRY_MAX_MS * 4);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops retrying when the player leaves the screen", async () => {
    fetchMock.mockResolvedValue(serverError());
    const { unmount } = renderHook(() => useAutoAdvance("g1", PHASE, 0));

    await tick(10_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    unmount();
    await tick(ADVANCE_RETRY_MAX_MS * 4);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("never calls advance for a finished game or a missing phase", async () => {
    renderHook(() => useAutoAdvance("g1", { ...PHASE, name: "ENDED" }, 0));
    renderHook(() => useAutoAdvance("g1", undefined, 0));

    await tick(60_000);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fires immediately when endsAt is already past, corrected for clock drift", async () => {
    fetchMock.mockResolvedValue(ok());
    // serverOffset pushes the corrected now past endsAt even though Date.now() is 0.
    renderHook(() => useAutoAdvance("g1", PHASE, 30_000));

    await tick(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("requestAdvance", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reports success without logging", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    await expect(requestAdvance("g1")).resolves.toBe(true);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("reports a 500 as failure and logs the status", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    await expect(requestAdvance("g1")).resolves.toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("500"));
  });

  it("reports a transport failure and logs the cause", async () => {
    const cause = new Error("Failed to fetch");
    fetchMock.mockRejectedValue(cause);
    await expect(requestAdvance("g1")).resolves.toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("g1"), cause);
  });
});

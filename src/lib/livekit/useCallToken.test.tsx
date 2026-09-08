import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { User } from "firebase/auth";

import {
  useCallToken,
  isRetryableTokenStatus,
  CALL_TOKEN_RETRY_BASE_MS,
  CALL_TOKEN_RETRY_MAX_MS,
  CALL_TOKEN_RETRYING_SUFFIX,
} from "./useCallToken";

/** Drain the microtask queue between fake-timer steps: every retry is armed
 * from inside a promise continuation, so advancing timers alone is not enough. */
async function tick(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

const GRANT = { token: "jwt", url: "wss://lk", room: "g1-DISCUSSION", canPublish: true };

describe("useCallToken", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let getIdToken: ReturnType<typeof vi.fn>;
  let user: User;

  beforeEach(() => {
    vi.useFakeTimers();
    // Deterministic jitter: 0ms of spread, so every deadline is exact.
    vi.spyOn(Math, "random").mockReturnValue(0);
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    getIdToken = vi.fn().mockResolvedValue("id-token");
    user = { getIdToken } as unknown as User;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const ok = () => ({ ok: true, status: 200, json: async () => GRANT });
  const fail = (status: number, error?: string) => ({
    ok: false,
    status,
    json: async () => (error === undefined ? {} : { error }),
  });

  it("returns the grant on a successful fetch and asks only once", async () => {
    fetchMock.mockResolvedValue(ok());
    const { result } = renderHook(() => useCallToken(user, "g1", true));

    await tick(0);
    expect(result.current.callToken).toEqual(GRANT);
    expect(result.current.error).toBeNull();

    await tick(CALL_TOKEN_RETRY_MAX_MS * 4);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries after a 500, which fetch resolves rather than rejects", async () => {
    fetchMock.mockResolvedValue(fail(500, "Lỗi xác thực phía máy chủ"));
    const { result } = renderHook(() => useCallToken(user, "g1", true));

    await tick(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.callToken).toBeNull();
    expect(result.current.error).toBe(
      "Lỗi xác thực phía máy chủ" + CALL_TOKEN_RETRYING_SUFFIX,
    );

    await tick(CALL_TOKEN_RETRY_BASE_MS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries after a transport failure", async () => {
    fetchMock.mockRejectedValue(new Error("Failed to fetch"));
    const { result } = renderHook(() => useCallToken(user, "g1", true));

    await tick(0);
    expect(result.current.error).toBe(
      "Không kết nối được phòng gọi" + CALL_TOKEN_RETRYING_SUFFIX,
    );

    await tick(CALL_TOKEN_RETRY_BASE_MS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries when getIdToken itself fails", async () => {
    getIdToken.mockRejectedValue(new Error("auth/network-request-failed"));
    renderHook(() => useCallToken(user, "g1", true));

    await tick(0);
    expect(getIdToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();

    await tick(CALL_TOKEN_RETRY_BASE_MS);
    expect(getIdToken).toHaveBeenCalledTimes(2);
  });

  it("backs off exponentially and caps", async () => {
    fetchMock.mockResolvedValue(fail(500));
    renderHook(() => useCallToken(user, "g1", true));

    await tick(0);
    let calls = 1;
    for (const delay of [1_000, 2_000, 4_000, 8_000]) {
      await tick(delay - 1);
      expect(fetchMock).toHaveBeenCalledTimes(calls);
      await tick(1);
      expect(fetchMock).toHaveBeenCalledTimes(++calls);
    }

    // 5th failure onwards would be 16s uncapped; it must stay at the cap.
    await tick(CALL_TOKEN_RETRY_MAX_MS - 1);
    expect(fetchMock).toHaveBeenCalledTimes(calls);
    await tick(1);
    expect(fetchMock).toHaveBeenCalledTimes(calls + 1);
  });

  it("stops retrying once an attempt succeeds", async () => {
    fetchMock.mockResolvedValueOnce(fail(500)).mockResolvedValue(ok());
    const { result } = renderHook(() => useCallToken(user, "g1", true));

    await tick(0);
    await tick(CALL_TOKEN_RETRY_BASE_MS);
    expect(result.current.callToken).toEqual(GRANT);
    expect(result.current.error).toBeNull();

    await tick(CALL_TOKEN_RETRY_MAX_MS * 4);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("spends exactly one forced ID-token refresh on a 401, then gives up", async () => {
    // Jitter is the only delay on the 401 retry, so give it a real value:
    // at 0ms of spread both attempts land inside the same tick and the
    // intermediate "retrying" state is unobservable.
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    fetchMock.mockResolvedValue(fail(401, "Token đăng nhập không hợp lệ"));
    const { result } = renderHook(() => useCallToken(user, "g1", true));

    await tick(0);
    expect(getIdToken).toHaveBeenNthCalledWith(1, false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBe(
      "Token đăng nhập không hợp lệ" + CALL_TOKEN_RETRYING_SUFFIX,
    );

    // The retry carries no backoff at all — a stale JWT is worth one
    // immediate second try, not a second of waiting.
    await tick(200);
    expect(getIdToken).toHaveBeenNthCalledWith(2, true);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // A second 401 with a freshly minted token is the server's real verdict.
    await tick(CALL_TOKEN_RETRY_MAX_MS * 4);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBe("Token đăng nhập không hợp lệ");
  });

  it.each([
    [400, "Thiếu gameId"],
    [403, "Phòng chưa bật Chơi xa"],
    [404, "Phase hiện tại không có phòng gọi"],
  ])("does not retry a %i verdict about this player", async (status, error) => {
    fetchMock.mockResolvedValue(fail(status, error));
    const { result } = renderHook(() => useCallToken(user, "g1", true));

    await tick(0);
    expect(result.current.error).toBe(error);

    await tick(CALL_TOKEN_RETRY_MAX_MS * 4);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to a generic message when the body carries no error", async () => {
    fetchMock.mockResolvedValue(fail(403));
    const { result } = renderHook(() => useCallToken(user, "g1", true));

    await tick(0);
    expect(result.current.error).toBe("Không lấy được phòng gọi");
  });

  it("cancels a pending retry when the phase turns the call room off", async () => {
    fetchMock.mockResolvedValue(fail(500));
    const { result, rerender } = renderHook(
      ({ enabled }) => useCallToken(user, "g1", enabled),
      { initialProps: { enabled: true } },
    );

    await tick(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });
    expect(result.current.error).toBeNull();

    await tick(CALL_TOKEN_RETRY_MAX_MS * 4);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("cancels a pending retry on unmount", async () => {
    fetchMock.mockResolvedValue(fail(500));
    const { unmount } = renderHook(() => useCallToken(user, "g1", true));

    await tick(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    unmount();
    await tick(CALL_TOKEN_RETRY_MAX_MS * 4);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("never fetches without a signed-in user or while disabled", async () => {
    const { rerender } = renderHook(
      ({ u, enabled }: { u: User | null; enabled: boolean }) =>
        useCallToken(u, "g1", enabled),
      { initialProps: { u: null as User | null, enabled: true } },
    );
    await tick(CALL_TOKEN_RETRY_MAX_MS);
    expect(fetchMock).not.toHaveBeenCalled();

    rerender({ u: user, enabled: false });
    await tick(CALL_TOKEN_RETRY_MAX_MS);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("classifies only 5xx as retryable", () => {
    expect(isRetryableTokenStatus(500)).toBe(true);
    expect(isRetryableTokenStatus(503)).toBe(true);
    for (const status of [400, 401, 403, 404, 429]) {
      expect(isRetryableTokenStatus(status)).toBe(false);
    }
  });
});

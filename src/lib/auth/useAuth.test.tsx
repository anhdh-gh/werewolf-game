import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const mockOnAuthStateChanged = vi.fn();
const mockSignInWithPopup = vi.fn();
const mockSignOut = vi.fn();

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
  signInWithPopup: (...args: unknown[]) => mockSignInWithPopup(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  GoogleAuthProvider: vi.fn(function GoogleAuthProvider() {
    return {};
  }),
}));

vi.mock("../firebase/client", () => ({ auth: {} }));

import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./useAuth";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("useAuth", () => {
  beforeEach(() => {
    mockOnAuthStateChanged.mockReset();
    mockSignInWithPopup.mockReset();
    mockSignOut.mockReset();
  });

  it("starts in loading state", () => {
    mockOnAuthStateChanged.mockReturnValue(() => {});
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it("reflects the signed-in user once auth state resolves", async () => {
    const fakeUser = { uid: "u1", displayName: "Anh", photoURL: null };
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(fakeUser);
      return () => {};
    });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(fakeUser);
  });

  it("calls signInWithPopup for signInWithGoogle", async () => {
    mockOnAuthStateChanged.mockReturnValue(() => {});
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.signInWithGoogle();
    });
    expect(mockSignInWithPopup).toHaveBeenCalled();
  });
});

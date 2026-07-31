import { beforeEach, describe, expect, it, vi } from "vitest";

import { authApi } from "@/features/auth/api/auth";

const mockSignInWithOAuth = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("authApi.signInWithGoogle", () => {
  it("google provider와 콜백 URL로 OAuth 로그인을 요청한다", async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({ error: null });

    await authApi.signInWithGoogle();

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: expect.stringContaining("/auth/callback"),
        scopes: "openid email profile",
      },
    });
  });

  it("redirectPath가 있으면 콜백 URL에 redirect 쿼리를 포함한다", async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({ error: null });

    await authApi.signInWithGoogle("/home");

    const callArgs = mockSignInWithOAuth.mock.calls[0][0] as { options: { redirectTo: string } };
    expect(callArgs.options.redirectTo).toContain("redirect=%2Fhome");
  });

  it("로그인 실패 시 supabase가 반환한 에러를 그대로 throw한다", async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({ error: new Error("oauth failed") });

    await expect(authApi.signInWithGoogle()).rejects.toThrow("oauth failed");
  });
});

describe("authApi.signOut", () => {
  it("로그아웃을 요청한다", async () => {
    mockSignOut.mockResolvedValueOnce({ error: null });

    await authApi.signOut();

    expect(mockSignOut).toHaveBeenCalled();
  });

  it("로그아웃 실패 시 supabase가 반환한 에러를 그대로 throw한다", async () => {
    mockSignOut.mockResolvedValueOnce({ error: new Error("signout failed") });

    await expect(authApi.signOut()).rejects.toThrow("signout failed");
  });
});

describe("authApi.getSession", () => {
  it("세션을 반환한다", async () => {
    const session = { access_token: "token" };
    mockGetSession.mockResolvedValueOnce({ data: { session }, error: null });

    const result = await authApi.getSession();

    expect(result).toBe(session);
  });

  it("조회 실패 시 supabase가 반환한 에러를 그대로 throw한다", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
      error: new Error("session failed"),
    });

    await expect(authApi.getSession()).rejects.toThrow("session failed");
  });
});

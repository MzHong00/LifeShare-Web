import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ROUTES } from "@/constants/routes";
import { authApi } from "@/features/auth/api/auth";
import { profileApi } from "@/features/profile/api/profile";
import { workspaceActions } from "@/features/workspace/stores/useWorkspaceStore";
import { workspacesApi } from "@/features/workspace/api/workspaces";
import { useAuthCallback } from "./useAuthCallback";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/features/auth/api/auth", () => ({
  authApi: { getSession: vi.fn() },
}));

vi.mock("@/features/profile/api/profile", () => ({
  profileApi: { createProfile: vi.fn() },
}));

vi.mock("@/features/workspace/api/workspaces", () => ({
  workspacesApi: { listMine: vi.fn() },
}));

vi.mock("@/features/workspace/stores/useWorkspaceStore", () => ({
  workspaceActions: { setCurrentWorkspaceId: vi.fn() },
}));

describe("useAuthCallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("세션이 없으면 로그인 페이지로 리다이렉트한다", async () => {
    vi.mocked(authApi.getSession).mockResolvedValue(
      null as unknown as Awaited<ReturnType<typeof authApi.getSession>>
    );

    renderHook(() => useAuthCallback(null));

    await waitFor(() => expect(replace).toHaveBeenCalledWith(ROUTES.LOGIN.path));
    expect(workspacesApi.listMine).not.toHaveBeenCalled();
  });

  it("워크스페이스가 있으면 첫 워크스페이스를 설정하고 홈으로 이동한다", async () => {
    vi.mocked(authApi.getSession).mockResolvedValue({
      access_token: "token",
    } as unknown as Awaited<ReturnType<typeof authApi.getSession>>);
    vi.mocked(workspacesApi.listMine).mockResolvedValue([
      { id: "ws-1" },
      { id: "ws-2" },
    ] as unknown as Awaited<ReturnType<typeof workspacesApi.listMine>>);

    renderHook(() => useAuthCallback(null));

    await waitFor(() => expect(replace).toHaveBeenCalledWith(ROUTES.HOME.path));
    expect(workspaceActions.setCurrentWorkspaceId).toHaveBeenCalledWith("ws-1");
  });

  it("세션 확보 후 profiles가 없으면 생성되도록 createProfile을 호출한다", async () => {
    vi.mocked(authApi.getSession).mockResolvedValue({
      access_token: "token",
    } as unknown as Awaited<ReturnType<typeof authApi.getSession>>);
    vi.mocked(workspacesApi.listMine).mockResolvedValue(
      [] as unknown as Awaited<ReturnType<typeof workspacesApi.listMine>>
    );

    renderHook(() => useAuthCallback(null));

    await waitFor(() => expect(profileApi.createProfile).toHaveBeenCalled());
  });

  it("워크스페이스가 없으면 워크스페이스 랜딩으로 이동한다", async () => {
    vi.mocked(authApi.getSession).mockResolvedValue({
      access_token: "token",
    } as unknown as Awaited<ReturnType<typeof authApi.getSession>>);
    vi.mocked(workspacesApi.listMine).mockResolvedValue(
      [] as unknown as Awaited<ReturnType<typeof workspacesApi.listMine>>
    );

    renderHook(() => useAuthCallback(null));

    await waitFor(() => expect(replace).toHaveBeenCalledWith(ROUTES.WORKSPACE.LANDING.path));
    expect(workspaceActions.setCurrentWorkspaceId).not.toHaveBeenCalled();
  });

  it("안전한 redirect 경로가 있으면 워크스페이스 존재 여부와 무관하게 해당 경로로 이동한다", async () => {
    vi.mocked(authApi.getSession).mockResolvedValue({
      access_token: "token",
    } as unknown as Awaited<ReturnType<typeof authApi.getSession>>);
    vi.mocked(workspacesApi.listMine).mockResolvedValue([{ id: "ws-1" }] as unknown as Awaited<
      ReturnType<typeof workspacesApi.listMine>
    >);

    renderHook(() => useAuthCallback("/todo"));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/todo"));
  });

  it("안전하지 않은 redirect 경로는 무시하고 기본 규칙을 따른다", async () => {
    vi.mocked(authApi.getSession).mockResolvedValue({
      access_token: "token",
    } as unknown as Awaited<ReturnType<typeof authApi.getSession>>);
    vi.mocked(workspacesApi.listMine).mockResolvedValue(
      [] as unknown as Awaited<ReturnType<typeof workspacesApi.listMine>>
    );

    renderHook(() => useAuthCallback("//evil.com"));

    await waitFor(() => expect(replace).toHaveBeenCalledWith(ROUTES.WORKSPACE.LANDING.path));
  });

  it("워크스페이스 조회가 실패하면 워크스페이스 랜딩으로 이동한다", async () => {
    vi.mocked(authApi.getSession).mockResolvedValue({
      access_token: "token",
    } as unknown as Awaited<ReturnType<typeof authApi.getSession>>);
    vi.mocked(workspacesApi.listMine).mockRejectedValue(new Error("failed"));

    renderHook(() => useAuthCallback(null));

    await waitFor(() => expect(replace).toHaveBeenCalledWith(ROUTES.WORKSPACE.LANDING.path));
    expect(workspaceActions.setCurrentWorkspaceId).not.toHaveBeenCalled();
  });
});

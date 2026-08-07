import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ROUTES } from "@/constants/routes";
import { modalActions } from "@/stores/useModalStore";
import { toastActions } from "@/stores/useToastStore";
import { workspaceActions } from "@/features/workspace/stores/useWorkspaceStore";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import {
  useUpdateWorkspaceNameMutation,
  useUpdateWorkspaceStartDateMutation,
  useUpdateWorkspaceThemeMutation,
  useUpdateWorkspaceMemberMutation,
  useLeaveWorkspaceMutation,
  useRemoveMemberMutation,
} from "@/features/workspace/queries/workspaceMutations";
import { useWorkspaceEditActions } from "./useWorkspaceEditActions";

const mockReplace = vi.fn();
const mockUser = { id: "user-1" };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: mockUserRef.current }),
}));

vi.mock("@/features/auth/queries/authQueries", () => ({
  authQueries: { user: vi.fn() },
}));

vi.mock("@/stores/useModalStore", () => ({
  modalActions: { showModal: vi.fn() },
}));

vi.mock("@/stores/useToastStore", () => ({
  toastActions: { showToast: vi.fn() },
}));

vi.mock("@/features/workspace/stores/useWorkspaceStore", () => ({
  workspaceActions: { setCurrentWorkspaceId: vi.fn() },
}));

vi.mock("@/features/workspace/hooks/useCurrentWorkspace", () => ({
  useCurrentWorkspace: vi.fn(),
}));

vi.mock("@/features/workspace/queries/workspaceMutations", () => ({
  useUpdateWorkspaceNameMutation: vi.fn(),
  useUpdateWorkspaceStartDateMutation: vi.fn(),
  useUpdateWorkspaceThemeMutation: vi.fn(),
  useUpdateWorkspaceMemberMutation: vi.fn(),
  useLeaveWorkspaceMutation: vi.fn(),
  useRemoveMemberMutation: vi.fn(),
}));

const mockUserRef = { current: mockUser as { id: string } | undefined };

const createMutation = (mutateAsync = vi.fn()) => ({ mutateAsync, isPending: false });

describe("useWorkspaceEditActions", () => {
  const updateNameMutateAsync = vi.fn();
  const updateStartDateMutateAsync = vi.fn();
  const updateThemeMutateAsync = vi.fn();
  const updateMemberMutateAsync = vi.fn();
  const leaveWorkspaceMutateAsync = vi.fn();
  const removeMemberMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRef.current = mockUser;
    vi.mocked(useCurrentWorkspace).mockReturnValue({
      currentWorkspace: { id: "workspace-1" } as ReturnType<
        typeof useCurrentWorkspace
      >["currentWorkspace"],
      workspaces: [],
      isPending: false,
      isError: false,
    });
    vi.mocked(useUpdateWorkspaceNameMutation).mockReturnValue(
      createMutation(updateNameMutateAsync) as unknown as ReturnType<
        typeof useUpdateWorkspaceNameMutation
      >
    );
    vi.mocked(useUpdateWorkspaceStartDateMutation).mockReturnValue(
      createMutation(updateStartDateMutateAsync) as unknown as ReturnType<
        typeof useUpdateWorkspaceStartDateMutation
      >
    );
    vi.mocked(useUpdateWorkspaceThemeMutation).mockReturnValue(
      createMutation(updateThemeMutateAsync) as unknown as ReturnType<
        typeof useUpdateWorkspaceThemeMutation
      >
    );
    vi.mocked(useUpdateWorkspaceMemberMutation).mockReturnValue(
      createMutation(updateMemberMutateAsync) as unknown as ReturnType<
        typeof useUpdateWorkspaceMemberMutation
      >
    );
    vi.mocked(useLeaveWorkspaceMutation).mockReturnValue(
      createMutation(leaveWorkspaceMutateAsync) as unknown as ReturnType<
        typeof useLeaveWorkspaceMutation
      >
    );
    vi.mocked(useRemoveMemberMutation).mockReturnValue(
      createMutation(removeMemberMutateAsync) as unknown as ReturnType<
        typeof useRemoveMemberMutation
      >
    );
  });

  it("changeName 성공 시 뮤테이션을 호출하고 에러 모달을 띄우지 않는다", async () => {
    updateNameMutateAsync.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useWorkspaceEditActions("workspace-1"));

    await result.current.changeName("새 이름");

    expect(updateNameMutateAsync).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      name: "새 이름",
    });
    expect(modalActions.showModal).not.toHaveBeenCalled();
  });

  it("changeName 실패 시 에러 메시지를 담아 알림 모달을 띄운다", async () => {
    updateNameMutateAsync.mockRejectedValueOnce(new Error("서버 에러"));
    const { result } = renderHook(() => useWorkspaceEditActions("workspace-1"));

    await result.current.changeName("새 이름");

    expect(modalActions.showModal).toHaveBeenCalledWith({
      type: "alert",
      title: "알림",
      message: "서버 에러",
    });
  });

  it("changeStartDate 실패 시 에러 메시지를 담아 알림 모달을 띄운다", async () => {
    updateStartDateMutateAsync.mockRejectedValueOnce(new Error("서버 에러"));
    const { result } = renderHook(() => useWorkspaceEditActions("workspace-1"));

    await result.current.changeStartDate("2026-01-01");

    expect(modalActions.showModal).toHaveBeenCalledWith(
      expect.objectContaining({ message: "서버 에러" })
    );
  });

  it("changeThemeColor 실패 시 에러 메시지를 담아 알림 모달을 띄운다", async () => {
    updateThemeMutateAsync.mockRejectedValueOnce(new Error("서버 에러"));
    const { result } = renderHook(() => useWorkspaceEditActions("workspace-1"));

    await result.current.changeThemeColor("pink");

    expect(modalActions.showModal).toHaveBeenCalledWith(
      expect.objectContaining({ message: "서버 에러" })
    );
  });

  it("user가 없으면 changeProfileName은 아무 동작도 하지 않는다", async () => {
    mockUserRef.current = undefined;
    const { result } = renderHook(() => useWorkspaceEditActions("workspace-1"));

    await result.current.changeProfileName("닉네임");

    expect(updateMemberMutateAsync).not.toHaveBeenCalled();
  });

  it("changeProfileName은 display_name을 업데이트한다", async () => {
    updateMemberMutateAsync.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useWorkspaceEditActions("workspace-1"));

    await result.current.changeProfileName("닉네임");

    expect(updateMemberMutateAsync).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      userId: "user-1",
      updates: { displayName: "닉네임" },
    });
  });

  it("leave 성공 시 현재 워크스페이스면 store를 초기화하고 목록 화면으로 이동한다", async () => {
    leaveWorkspaceMutateAsync.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useWorkspaceEditActions("workspace-1"));

    await result.current.leave();

    expect(leaveWorkspaceMutateAsync).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      userId: "user-1",
    });
    expect(workspaceActions.setCurrentWorkspaceId).toHaveBeenCalledWith(null);
    expect(mockReplace).toHaveBeenCalledWith(ROUTES.WORKSPACE.LIST.path);
  });

  it("leave 시 현재 워크스페이스가 아니면 store를 초기화하지 않는다", async () => {
    vi.mocked(useCurrentWorkspace).mockReturnValue({
      currentWorkspace: { id: "other-workspace" } as ReturnType<
        typeof useCurrentWorkspace
      >["currentWorkspace"],
      workspaces: [],
      isPending: false,
      isError: false,
    });
    leaveWorkspaceMutateAsync.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useWorkspaceEditActions("workspace-1"));

    await result.current.leave();

    expect(workspaceActions.setCurrentWorkspaceId).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith(ROUTES.WORKSPACE.LIST.path);
  });

  it("leave 실패 시 에러 메시지를 담아 알림 모달을 띄운다", async () => {
    leaveWorkspaceMutateAsync.mockRejectedValueOnce(new Error("서버 에러"));
    const { result } = renderHook(() => useWorkspaceEditActions("workspace-1"));

    await result.current.leave();

    expect(modalActions.showModal).toHaveBeenCalledWith(
      expect.objectContaining({ message: "서버 에러" })
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("kickMember는 대상 멤버 제거 뮤테이션을 호출한다", async () => {
    removeMemberMutateAsync.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useWorkspaceEditActions("workspace-1"));

    await result.current.kickMember("user-2");

    expect(removeMemberMutateAsync).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      userId: "user-2",
    });
    expect(modalActions.showModal).not.toHaveBeenCalled();
  });

  it("kickMember 실패 시 에러 메시지를 담아 알림 모달을 띄운다", async () => {
    removeMemberMutateAsync.mockRejectedValueOnce(new Error("권한 없음"));
    const { result } = renderHook(() => useWorkspaceEditActions("workspace-1"));

    await result.current.kickMember("user-2");

    expect(modalActions.showModal).toHaveBeenCalledWith(
      expect.objectContaining({ message: "권한 없음" })
    );
  });
});

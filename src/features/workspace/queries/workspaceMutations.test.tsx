import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { workspacesApi } from "@/features/workspace/api/workspaces";
import { workspaceQueries } from "@/features/workspace/queries/workspaceQueries";
import {
  useCreateInviteCodeMutation,
  useCreateWorkspaceMutation,
  useJoinWorkspaceMutation,
  useLeaveWorkspaceMutation,
  useRemoveMemberMutation,
  useUpdateWorkspaceMemberMutation,
  useUpdateWorkspaceNameMutation,
  useUpdateWorkspaceStartDateMutation,
  useUpdateWorkspaceThemeMutation,
} from "@/features/workspace/queries/workspaceMutations";

import type { Workspace } from "@/features/workspace/types/workspace";
import type { ReactNode } from "react";

vi.mock("@/features/workspace/api/workspaces", () => ({
  workspacesApi: {
    create: vi.fn(),
    join: vi.fn(),
    updateName: vi.fn(),
    updateStartDate: vi.fn(),
    updateThemeColor: vi.fn(),
    updateMember: vi.fn(),
    createInviteCode: vi.fn(),
    leave: vi.fn(),
    removeMember: vi.fn(),
  },
}));

const WORKSPACE_ID = "ws-1"; // 테스트용 워크스페이스 ID
const USER_ID = "user-1"; // 테스트용 사용자 ID
const WORKSPACE = { id: WORKSPACE_ID, name: "우리집" } as unknown as Workspace;

/** QueryClientProvider wrapper와 무효화 감시용 spy를 함께 만든다 */
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { Wrapper, queryClient, invalidateSpy };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("mine 무효화 뮤테이션", () => {
  it("useCreateWorkspaceMutation이 성공 시 mine 쿼리를 무효화한다", async () => {
    vi.mocked(workspacesApi.create).mockResolvedValue({ workspace: WORKSPACE });
    const { Wrapper, invalidateSpy } = createWrapper();

    const { result } = renderHook(() => useCreateWorkspaceMutation(), { wrapper: Wrapper });
    result.current.mutate({ name: "우리집", type: "couple", startDate: "2026-01-01" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(workspacesApi.create).toHaveBeenCalledWith("우리집", "couple", "2026-01-01");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: workspaceQueries.keys.mine() });
  });

  it("useJoinWorkspaceMutation이 workspaceId와 inviteCode를 그대로 전달하고 mine을 무효화한다", async () => {
    vi.mocked(workspacesApi.join).mockResolvedValue(WORKSPACE);
    const { Wrapper, invalidateSpy } = createWrapper();

    const { result } = renderHook(() => useJoinWorkspaceMutation(), { wrapper: Wrapper });
    result.current.mutate({ workspaceId: WORKSPACE_ID, inviteCode: "K7M2P9QX" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(workspacesApi.join).toHaveBeenCalledWith(WORKSPACE_ID, "K7M2P9QX");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: workspaceQueries.keys.mine() });
  });

  it("useUpdateWorkspaceNameMutation이 이름을 전달하고 mine을 무효화한다", async () => {
    vi.mocked(workspacesApi.updateName).mockResolvedValue(undefined);
    const { Wrapper, invalidateSpy } = createWrapper();

    const { result } = renderHook(() => useUpdateWorkspaceNameMutation(), { wrapper: Wrapper });
    result.current.mutate({ workspaceId: WORKSPACE_ID, name: "새 이름" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(workspacesApi.updateName).toHaveBeenCalledWith(WORKSPACE_ID, "새 이름");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: workspaceQueries.keys.mine() });
  });

  it("useUpdateWorkspaceStartDateMutation이 시작일을 전달하고 mine을 무효화한다", async () => {
    vi.mocked(workspacesApi.updateStartDate).mockResolvedValue(undefined);
    const { Wrapper, invalidateSpy } = createWrapper();

    const { result } = renderHook(() => useUpdateWorkspaceStartDateMutation(), {
      wrapper: Wrapper,
    });
    result.current.mutate({ workspaceId: WORKSPACE_ID, startDate: "2026-02-01" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(workspacesApi.updateStartDate).toHaveBeenCalledWith(WORKSPACE_ID, "2026-02-01");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: workspaceQueries.keys.mine() });
  });

  it("useUpdateWorkspaceThemeMutation이 테마 색상을 전달하고 mine을 무효화한다", async () => {
    vi.mocked(workspacesApi.updateThemeColor).mockResolvedValue(undefined);
    const { Wrapper, invalidateSpy } = createWrapper();

    const { result } = renderHook(() => useUpdateWorkspaceThemeMutation(), { wrapper: Wrapper });
    result.current.mutate({ workspaceId: WORKSPACE_ID, themeColor: "blue" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(workspacesApi.updateThemeColor).toHaveBeenCalledWith(WORKSPACE_ID, "blue");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: workspaceQueries.keys.mine() });
  });

  it("useUpdateWorkspaceMemberMutation이 workspaceId·userId·updates를 전달하고 mine을 무효화한다", async () => {
    vi.mocked(workspacesApi.updateMember).mockResolvedValue(undefined);
    const { Wrapper, invalidateSpy } = createWrapper();

    const { result } = renderHook(() => useUpdateWorkspaceMemberMutation(), { wrapper: Wrapper });
    result.current.mutate({
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      updates: { displayName: "새 이름" },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(workspacesApi.updateMember).toHaveBeenCalledWith(WORKSPACE_ID, USER_ID, {
      displayName: "새 이름",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: workspaceQueries.keys.mine() });
  });

  it("useLeaveWorkspaceMutation이 workspaceId·userId를 전달하고 mine을 무효화한다", async () => {
    vi.mocked(workspacesApi.leave).mockResolvedValue(undefined);
    const { Wrapper, invalidateSpy } = createWrapper();

    const { result } = renderHook(() => useLeaveWorkspaceMutation(), { wrapper: Wrapper });
    result.current.mutate({ workspaceId: WORKSPACE_ID, userId: USER_ID });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(workspacesApi.leave).toHaveBeenCalledWith(WORKSPACE_ID, USER_ID);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: workspaceQueries.keys.mine() });
  });

  it("useRemoveMemberMutation이 workspaceId·userId를 전달하고 mine을 무효화한다", async () => {
    vi.mocked(workspacesApi.removeMember).mockResolvedValue(undefined);
    const { Wrapper, invalidateSpy } = createWrapper();

    const { result } = renderHook(() => useRemoveMemberMutation(), { wrapper: Wrapper });
    result.current.mutate({ workspaceId: WORKSPACE_ID, userId: USER_ID });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(workspacesApi.removeMember).toHaveBeenCalledWith(WORKSPACE_ID, USER_ID);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: workspaceQueries.keys.mine() });
  });

  it("성공한 뮤테이션 이후 mine 쿼리가 실제로 stale 상태가 된다", async () => {
    vi.mocked(workspacesApi.updateName).mockResolvedValue(undefined);
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData<Workspace[]>(workspaceQueries.mine().queryKey, [WORKSPACE]);

    const { result } = renderHook(() => useUpdateWorkspaceNameMutation(), { wrapper: Wrapper });
    result.current.mutate({ workspaceId: WORKSPACE_ID, name: "새 이름" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryState(workspaceQueries.mine().queryKey)?.isInvalidated).toBe(true);
  });
});

describe("useCreateInviteCodeMutation", () => {
  it("성공 시 해당 워크스페이스의 inviteCode 캐시를 새 코드로 갱신한다", async () => {
    vi.mocked(workspacesApi.createInviteCode).mockResolvedValue("NEWCODE1");
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData<string | null>(
      workspaceQueries.inviteCode(WORKSPACE_ID).queryKey,
      "OLDCODE1"
    );

    const { result } = renderHook(() => useCreateInviteCodeMutation(), { wrapper: Wrapper });
    result.current.mutate({ workspaceId: WORKSPACE_ID });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(workspacesApi.createInviteCode).toHaveBeenCalledWith(WORKSPACE_ID);
    expect(queryClient.getQueryData(workspaceQueries.inviteCode(WORKSPACE_ID).queryKey)).toBe(
      "NEWCODE1"
    );
  });

  it("다른 워크스페이스의 inviteCode 캐시는 건드리지 않는다", async () => {
    vi.mocked(workspacesApi.createInviteCode).mockResolvedValue("NEWCODE1");
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData<string | null>(
      workspaceQueries.inviteCode("ws-2").queryKey,
      "OTHERCODE"
    );

    const { result } = renderHook(() => useCreateInviteCodeMutation(), { wrapper: Wrapper });
    result.current.mutate({ workspaceId: WORKSPACE_ID });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(workspaceQueries.inviteCode("ws-2").queryKey)).toBe(
      "OTHERCODE"
    );
  });
});

describe("뮤테이션 실패", () => {
  it("useCreateWorkspaceMutation 실패 시 에러가 그대로 전파되고 mine을 무효화하지 않는다", async () => {
    vi.mocked(workspacesApi.create).mockRejectedValue(
      new Error("워크스페이스 생성에 실패했습니다.")
    );
    const { Wrapper, invalidateSpy } = createWrapper();

    const { result } = renderHook(() => useCreateWorkspaceMutation(), { wrapper: Wrapper });
    result.current.mutate({ name: "우리집", type: "couple" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("워크스페이스 생성에 실패했습니다.");
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("useCreateInviteCodeMutation 실패 시 에러가 전파되고 캐시가 유지된다", async () => {
    vi.mocked(workspacesApi.createInviteCode).mockRejectedValue(
      new Error("초대 코드 생성에 실패했습니다.")
    );
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData<string | null>(
      workspaceQueries.inviteCode(WORKSPACE_ID).queryKey,
      "OLDCODE1"
    );

    const { result } = renderHook(() => useCreateInviteCodeMutation(), { wrapper: Wrapper });
    result.current.mutate({ workspaceId: WORKSPACE_ID });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("초대 코드 생성에 실패했습니다.");
    expect(queryClient.getQueryData(workspaceQueries.inviteCode(WORKSPACE_ID).queryKey)).toBe(
      "OLDCODE1"
    );
  });

  it("useRemoveMemberMutation 실패 시 mutateAsync가 reject된다", async () => {
    vi.mocked(workspacesApi.removeMember).mockRejectedValue(
      new Error("멤버 내보내기에 실패했습니다.")
    );
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useRemoveMemberMutation(), { wrapper: Wrapper });

    await expect(
      result.current.mutateAsync({ workspaceId: WORKSPACE_ID, userId: USER_ID })
    ).rejects.toThrow("멤버 내보내기에 실패했습니다.");
  });
});

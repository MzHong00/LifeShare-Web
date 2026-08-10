import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useWorkspaceStore } from "@/features/workspace/stores/useWorkspaceStore";
import { workspaceQueries } from "@/features/workspace/queries/workspaceQueries";
import { authQueries } from "@/features/auth/queries/authQueries";
import { useCurrentWorkspace } from "./useCurrentWorkspace";

import type { Workspace } from "@/features/workspace/types/workspace";
import type { User } from "@/types/user";
import type { ReactNode } from "react";

vi.mock("@/features/workspace/stores/useWorkspaceStore", () => ({
  useWorkspaceStore: vi.fn(),
}));

vi.mock("@/features/workspace/queries/workspaceQueries", () => ({
  workspaceQueries: { mine: vi.fn(() => ({ queryKey: ["workspaces", "mine"] })) },
}));

vi.mock("@/features/auth/queries/authQueries", () => ({
  authQueries: { user: vi.fn(() => ({ queryKey: ["auth", "user"] })) },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { Wrapper, queryClient };
};

const WORKSPACES: Workspace[] = [
  { id: "ws-1", name: "워크스페이스1", type: "couple", themeColor: "blue" },
  { id: "ws-2", name: "워크스페이스2", type: "couple", themeColor: "pink" },
];

describe("useCurrentWorkspace", () => {
  it("저장된 currentWorkspaceId와 일치하는 워크스페이스를 반환한다", async () => {
    vi.mocked(useWorkspaceStore).mockReturnValue("ws-2");
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(workspaceQueries.mine().queryKey, WORKSPACES);

    const { result } = renderHook(() => useCurrentWorkspace(), { wrapper: Wrapper });

    expect(result.current.currentWorkspace).toEqual(WORKSPACES[1]);
    expect(result.current.workspaces).toEqual(WORKSPACES);
  });

  it("저장된 ID가 목록에 없으면 첫 워크스페이스로 폴백한다", () => {
    vi.mocked(useWorkspaceStore).mockReturnValue("missing-id");
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(workspaceQueries.mine().queryKey, WORKSPACES);

    const { result } = renderHook(() => useCurrentWorkspace(), { wrapper: Wrapper });

    expect(result.current.currentWorkspace).toEqual(WORKSPACES[0]);
  });

  it("워크스페이스 목록이 비어있으면 null을 반환한다", () => {
    vi.mocked(useWorkspaceStore).mockReturnValue(null);
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useCurrentWorkspace(), { wrapper: Wrapper });

    expect(result.current.currentWorkspace).toBeNull();
    expect(result.current.workspaces).toEqual([]);
  });

  it("멤버 목록의 '나' 항목은 사진만 전역 프로필로 덮어쓰고, 이름은 라이프룸별 설정을 그대로 유지한다", () => {
    vi.mocked(useWorkspaceStore).mockReturnValue("ws-1");
    const { Wrapper, queryClient } = createWrapper();
    const workspacesWithMembers: Workspace[] = [
      {
        ...WORKSPACES[0],
        members: [
          {
            id: "user-1",
            name: "이 방에서 쓰는 이름",
            email: "me@test.com",
            avatar: "old.png",
            role: "owner",
          },
          { id: "user-2", name: "파트너", email: "partner@test.com", role: "member" },
        ],
      },
    ];
    queryClient.setQueryData(workspaceQueries.mine().queryKey, workspacesWithMembers);
    queryClient.setQueryData<User>(authQueries.user().queryKey, {
      id: "user-1",
      name: "최신 전역 이름",
      profileImage: "new.png",
    });

    const { result } = renderHook(() => useCurrentWorkspace(), { wrapper: Wrapper });

    expect(result.current.currentWorkspace?.members).toEqual([
      {
        id: "user-1",
        name: "이 방에서 쓰는 이름",
        email: "me@test.com",
        avatar: "new.png",
        role: "owner",
      },
      { id: "user-2", name: "파트너", email: "partner@test.com", role: "member" },
    ]);
  });
});

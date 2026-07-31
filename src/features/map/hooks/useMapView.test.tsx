import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { useStoryStore, storyActions } from "@/features/stories/stores/useStoryStore";
import { storyQueries } from "@/features/stories/queries/storyQueries";
import { authQueries } from "@/features/auth/queries/authQueries";
import { useStoryRecording } from "@/features/map/hooks/useStoryRecording";
import { toastActions } from "@/stores/useToastStore";
import { useMapView } from "./useMapView";

import type { Story } from "@/features/stories/types/story";
import type { User } from "@/types/user";
import type { Workspace, WorkspaceMember } from "@/features/workspace/types/workspace";
import type { ReactNode } from "react";

vi.mock("@/features/workspace/hooks/useCurrentWorkspace", () => ({
  useCurrentWorkspace: vi.fn(),
}));

vi.mock("@/features/stories/stores/useStoryStore", () => ({
  useStoryStore: vi.fn(),
  storyActions: {
    setSelectedStoryId: vi.fn(),
  },
}));

vi.mock("@/features/map/hooks/useStoryRecording", () => ({
  useStoryRecording: vi.fn(),
}));

vi.mock("@/stores/useToastStore", () => ({
  toastActions: {
    showToast: vi.fn(),
  },
}));

vi.mock("@/features/stories/queries/storyQueries", () => ({
  storyQueries: {
    list: vi.fn((workspaceId: string) => ({ queryKey: ["stories", "list", workspaceId] })),
  },
}));

vi.mock("@/features/auth/queries/authQueries", () => ({
  authQueries: {
    user: vi.fn(() => ({ queryKey: ["auth", "user"] })),
  },
}));

const ME_ID = "user-me";
const PARTNER_ID = "user-partner";

const createMember = (id: string, name: string): WorkspaceMember => ({
  id,
  name,
  email: `${id}@test.com`,
});

const createWorkspace = (members: WorkspaceMember[]): Workspace => ({
  id: "ws-1",
  name: "워크스페이스1",
  type: "couple",
  themeColor: "blue",
  members,
});

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { Wrapper, queryClient };
};

describe("useMapView", () => {
  const toggleRecording = vi.fn();
  const myLocation = { lat: 37.5, lng: 127.0 };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCurrentWorkspace).mockReturnValue({
      currentWorkspace: createWorkspace([
        createMember(ME_ID, "나"),
        createMember(PARTNER_ID, "상대"),
      ]),
      workspaces: [],
    } as unknown as ReturnType<typeof useCurrentWorkspace>);
    vi.mocked(useStoryStore).mockReturnValue(null);
    vi.mocked(useStoryRecording).mockReturnValue({
      myLocation,
      isRecording: false,
      recordingPath: [],
      toggleRecording,
    } as unknown as ReturnType<typeof useStoryRecording>);
  });

  it("본인 위치만 memberLocations에 포함한다", () => {
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(authQueries.user().queryKey, { id: ME_ID } as unknown as User);
    queryClient.setQueryData(storyQueries.list("ws-1").queryKey, [] as unknown as Story[]);

    const { result } = renderHook(() => useMapView(), { wrapper: Wrapper });

    expect(result.current.memberLocations).toHaveLength(1);
    expect(result.current.memberLocations[0].member.id).toBe(ME_ID);
    expect(result.current.memberLocations[0]).toMatchObject(myLocation);
  });

  it("selectMember 호출 시 해당 멤버 위치로 포커스를 이동하고 선택 상태를 갱신하며 선택된 스토리를 해제한다", () => {
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(authQueries.user().queryKey, { id: ME_ID } as unknown as User);
    queryClient.setQueryData(storyQueries.list("ws-1").queryKey, [] as unknown as Story[]);

    const { result } = renderHook(() => useMapView(), { wrapper: Wrapper });

    act(() => {
      result.current.selectMember(ME_ID);
    });

    expect(result.current.focusLocation).toEqual(myLocation);
    expect(result.current.selectedUser?.id).toBe(ME_ID);
    expect(storyActions.setSelectedStoryId).toHaveBeenCalledWith(null);
  });

  it("같은 멤버를 다시 selectMember 하면 선택을 해제한다", () => {
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(authQueries.user().queryKey, { id: ME_ID } as unknown as User);
    queryClient.setQueryData(storyQueries.list("ws-1").queryKey, [] as unknown as Story[]);

    const { result } = renderHook(() => useMapView(), { wrapper: Wrapper });

    act(() => {
      result.current.selectMember(ME_ID);
    });
    act(() => {
      result.current.selectMember(ME_ID);
    });

    expect(result.current.selectedUser).toBeUndefined();
  });

  it("selectStory 호출 시 스토리를 선택하고 선택된 멤버를 해제한다", () => {
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(authQueries.user().queryKey, { id: ME_ID } as unknown as User);
    queryClient.setQueryData(storyQueries.list("ws-1").queryKey, [] as unknown as Story[]);

    const { result } = renderHook(() => useMapView(), { wrapper: Wrapper });

    act(() => {
      result.current.selectMember(ME_ID);
    });
    act(() => {
      result.current.selectStory("story-1");
    });

    expect(storyActions.setSelectedStoryId).toHaveBeenCalledWith("story-1");
    expect(result.current.selectedUser).toBeUndefined();
  });

  it("openDirections 호출 시 상대방 위치가 없으면 에러 토스트를 띄우고 새 탭을 열지 않는다", () => {
    vi.mocked(useCurrentWorkspace).mockReturnValue({
      currentWorkspace: createWorkspace([createMember(ME_ID, "나")]),
      workspaces: [],
    } as unknown as ReturnType<typeof useCurrentWorkspace>);
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(authQueries.user().queryKey, { id: ME_ID } as unknown as User);
    queryClient.setQueryData(storyQueries.list("ws-1").queryKey, [] as unknown as Story[]);

    const { result } = renderHook(() => useMapView(), { wrapper: Wrapper });

    act(() => {
      result.current.openDirections();
    });

    expect(toastActions.showToast).toHaveBeenCalledWith(
      "상대방의 위치를 아직 확인할 수 없습니다.",
      "error"
    );
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it("memberLocations에 본인 위치만 있으므로 상대(myUserId 아닌 멤버)가 없으면 항상 에러 토스트를 띄운다", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(authQueries.user().queryKey, { id: ME_ID } as unknown as User);
    queryClient.setQueryData(storyQueries.list("ws-1").queryKey, [] as unknown as Story[]);

    const { result } = renderHook(() => useMapView(), { wrapper: Wrapper });

    act(() => {
      result.current.openDirections();
    });

    expect(openSpy).not.toHaveBeenCalled();
    expect(toastActions.showToast).toHaveBeenCalledWith(
      "상대방의 위치를 아직 확인할 수 없습니다.",
      "error"
    );
    openSpy.mockRestore();
  });
});

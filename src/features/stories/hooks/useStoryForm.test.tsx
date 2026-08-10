import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { authQueries } from "@/features/auth/queries/authQueries";
import { storyQueries } from "@/features/stories/queries/storyQueries";
import {
  useCreateStoryMutation,
  useUpdateStoryMutation,
} from "@/features/stories/queries/storyMutations";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { toastActions } from "@/stores/useToastStore";
import { storageApi } from "@/lib/supabase/storage";
import { resizeImageFile } from "@/utils/imageResize";
import { PATH_COLORS } from "@/constants/theme";
import { getTodayDateString } from "@/utils/date";
import { useStoryForm } from "./useStoryForm";

import type { Story } from "@/features/stories/types/story";
import type { User } from "@/types/user";
import type { ReactNode } from "react";

const mockBack = vi.fn();
const mockSearchParams = new Map<string, string>();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: mockBack }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams.get(key) ?? null,
  }),
}));

vi.mock("@/stores/useToastStore", () => ({
  toastActions: { showToast: vi.fn() },
}));

vi.mock("@/features/workspace/hooks/useCurrentWorkspace", () => ({
  useCurrentWorkspace: vi.fn(),
}));

vi.mock("@/features/auth/queries/authQueries", () => ({
  authQueries: {
    user: vi.fn(() => ({ queryKey: ["auth", "user"] })),
  },
}));

vi.mock("@/features/stories/queries/storyQueries", () => ({
  storyQueries: {
    list: vi.fn((workspaceId: string) => ({ queryKey: ["stories", "list", workspaceId] })),
  },
}));

vi.mock("@/features/stories/queries/storyMutations", () => ({
  useCreateStoryMutation: vi.fn(),
  useUpdateStoryMutation: vi.fn(),
}));

vi.mock("@/lib/supabase/storage", () => ({
  storageApi: { uploadImage: vi.fn() },
}));

vi.mock("@/utils/imageResize", () => ({
  resizeImageFile: vi.fn((file: File) => Promise.resolve(file)),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { Wrapper, queryClient };
};

const createMutation = (mutateAsync = vi.fn()) => ({ mutateAsync, isPending: false });

describe("useStoryForm", () => {
  const today = getTodayDateString();
  const createMutateAsync = vi.fn();
  const updateMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.clear();
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();

    vi.mocked(useCurrentWorkspace).mockReturnValue({
      currentWorkspace: {
        id: "ws-1",
        name: "워크스페이스1",
        type: "couple",
        themeColor: "blue",
        members: [{ id: "member-1", displayName: "민" }],
      },
      workspaces: [],
    } as unknown as ReturnType<typeof useCurrentWorkspace>);
    vi.mocked(useCreateStoryMutation).mockReturnValue(
      createMutation(createMutateAsync) as unknown as ReturnType<typeof useCreateStoryMutation>
    );
    vi.mocked(useUpdateStoryMutation).mockReturnValue(
      createMutation(updateMutateAsync) as unknown as ReturnType<typeof useUpdateStoryMutation>
    );
  });

  it("생성 모드에서는 초기값이 오늘 날짜와 빈 제목으로 설정된다", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useStoryForm(), { wrapper: Wrapper });

    expect(result.current.isEditMode).toBe(false);
    expect(result.current.title).toBe("");
    expect(result.current.date).toBe(today);
    expect(result.current.path).toEqual([]);
  });

  it("수정 모드에서 스토리 로드가 완료되면 폼 값을 기존 값으로 채운다", async () => {
    mockSearchParams.set("storyId", "story-1");
    const { Wrapper, queryClient } = createWrapper();
    const stories = [
      {
        id: "story-1",
        title: "기존 제목",
        description: "기존 설명",
        date: "2026-01-01T00:00:00.000Z",
        thumbnailUrl: "https://example.com/thumb.jpg",
        path: [{ latitude: 1, longitude: 1, timestamp: 1 }],
        pathColor: "#F04452",
      },
    ];
    queryClient.setQueryData(storyQueries.list("ws-1").queryKey, stories as unknown as Story[]);

    const { result } = renderHook(() => useStoryForm(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.title).toBe("기존 제목"));
    expect(result.current.description).toBe("기존 설명");
    expect(result.current.date).toBe("2026-01-01");
    expect(result.current.pathColor).toBe("#F04452");
    expect(result.current.path).toEqual([{ latitude: 1, longitude: 1, timestamp: 1 }]);
    expect(result.current.previewUrl).toBe("https://example.com/thumb.jpg");
  });

  it("handleImageSelect 시 리사이징된 파일로 미리보기 blob URL을 생성한다", async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useStoryForm(), { wrapper: Wrapper });

    const file = new File(["content"], "photo.png", { type: "image/png" });
    const event = {
      target: { files: [file], value: "x" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleImageSelect(event);
    });

    expect(resizeImageFile).toHaveBeenCalledWith(file);
    expect(result.current.previewUrl).toBe("blob:mock-url");
  });

  it("handleRemoveImage 시 미리보기와 썸네일을 초기화하고 blob URL을 해제한다", async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useStoryForm(), { wrapper: Wrapper });

    const file = new File(["content"], "photo.png", { type: "image/png" });
    const event = {
      target: { files: [file], value: "x" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleImageSelect(event);
    });
    expect(result.current.previewUrl).toBe("blob:mock-url");

    act(() => {
      result.current.handleRemoveImage();
    });

    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    expect(result.current.previewUrl).toBeUndefined();
  });

  it("handlePathConfirm 시 경로와 색상을 반영하고 지도를 닫는다", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useStoryForm(), { wrapper: Wrapper });

    act(() => {
      result.current.setIsPathPickerOpen(true);
    });

    act(() => {
      result.current.handlePathConfirm([{ latitude: 1, longitude: 2, timestamp: 2 }], "#000000");
    });

    expect(result.current.path).toEqual([{ latitude: 1, longitude: 2, timestamp: 2 }]);
    expect(result.current.pathColor).toBe("#000000");
    expect(result.current.isPathPickerOpen).toBe(false);
  });

  it("생성 모드에서 handleSave 성공 시 createStory를 호출하고 이전 화면으로 돌아간다", async () => {
    createMutateAsync.mockResolvedValueOnce(undefined);
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData<User>(authQueries.user().queryKey, { id: "user-1", name: "테스트" });

    const { result } = renderHook(() => useStoryForm(), { wrapper: Wrapper });

    act(() => {
      result.current.setTitle("새 기억");
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(createMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "새 기억",
        userId: "user-1",
        workspaceId: "ws-1",
      })
    );
    expect(toastActions.showToast).toHaveBeenCalledWith("기억이 기록되었습니다.", "success");
    expect(mockBack).toHaveBeenCalled();
  });

  it("수정 모드에서 handleSave 성공 시 updateStory를 호출한다", async () => {
    mockSearchParams.set("storyId", "story-1");
    const { Wrapper, queryClient } = createWrapper();
    const stories = [
      {
        id: "story-1",
        title: "기존 제목",
        description: "",
        date: "2026-01-01T00:00:00.000Z",
        thumbnailUrl: undefined,
        path: [],
        pathColor: "#F04452",
      },
    ];
    queryClient.setQueryData(storyQueries.list("ws-1").queryKey, stories as unknown as Story[]);
    updateMutateAsync.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useStoryForm(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.title).toBe("기존 제목"));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(updateMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "story-1",
        data: expect.objectContaining({ title: "기존 제목" }),
      })
    );
    expect(toastActions.showToast).toHaveBeenCalledWith("기억이 수정되었습니다.", "success");
    expect(mockBack).toHaveBeenCalled();
  });

  it("존재하지 않는 storyId로 수정 시도 시 에러 토스트를 띄우고 저장하지 않는다", async () => {
    mockSearchParams.set("storyId", "missing-story");
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(storyQueries.list("ws-1").queryKey, [] as unknown as Story[]);

    const { result } = renderHook(() => useStoryForm(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isEditMode).toBe(true));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(toastActions.showToast).toHaveBeenCalledWith("스토리를 찾을 수 없습니다.", "error");
    expect(updateMutateAsync).not.toHaveBeenCalled();
  });

  it("handleSave 실패 시 에러 토스트를 띄운다", async () => {
    createMutateAsync.mockRejectedValueOnce(new Error("fail"));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useStoryForm(), { wrapper: Wrapper });

    act(() => {
      result.current.setTitle("새 기억");
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(toastActions.showToast).toHaveBeenCalledWith(
      "저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
      "error"
    );
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("이미지 업로드 실패 시 에러 토스트를 띄우고 저장을 중단한다", async () => {
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData<User>(authQueries.user().queryKey, { id: "user-1", name: "테스트" });
    vi.mocked(storageApi.uploadImage).mockRejectedValueOnce(new Error("upload fail"));

    const { result } = renderHook(() => useStoryForm(), { wrapper: Wrapper });

    act(() => {
      result.current.setTitle("새 기억");
    });

    const file = new File(["content"], "photo.png", { type: "image/png" });
    const event = {
      target: { files: [file], value: "x" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    await act(async () => {
      await result.current.handleImageSelect(event);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(toastActions.showToast).toHaveBeenCalledWith(
      "이미지 업로드에 실패했습니다. 사진 없이 저장하거나 다시 시도해주세요.",
      "error"
    );
    expect(createMutateAsync).not.toHaveBeenCalled();
  });

  it("초기 렌더 이후 스토리가 뒤늦게 로드되면 폼 값을 기존 값으로 다시 채운다", async () => {
    mockSearchParams.set("storyId", "story-1");
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(storyQueries.list("ws-1").queryKey, [] as unknown as Story[]);

    const { result } = renderHook(() => useStoryForm(), { wrapper: Wrapper });
    expect(result.current.title).toBe("");
    expect(result.current.date).toBe(today);

    act(() => {
      queryClient.setQueryData(storyQueries.list("ws-1").queryKey, [
        {
          id: "story-1",
          title: "나중에 온 제목",
          description: "나중에 온 설명",
          date: "2026-02-03T00:00:00.000Z",
          thumbnailUrl: "https://example.com/late.jpg",
          path: [{ latitude: 3, longitude: 4, timestamp: 3 }],
          pathColor: "#F04452",
        },
      ] as unknown as Story[]);
    });

    await waitFor(() => expect(result.current.title).toBe("나중에 온 제목"));
    expect(result.current.description).toBe("나중에 온 설명");
    expect(result.current.date).toBe("2026-02-03");
    expect(result.current.pathColor).toBe("#F04452");
    expect(result.current.path).toEqual([{ latitude: 3, longitude: 4, timestamp: 3 }]);
    expect(result.current.previewUrl).toBe("https://example.com/late.jpg");
  });

  it("뒤늦게 로드된 스토리에 제목·색상·경로가 없으면 기본값으로 채운다", async () => {
    mockSearchParams.set("storyId", "story-1");
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(storyQueries.list("ws-1").queryKey, [] as unknown as Story[]);

    const { result } = renderHook(() => useStoryForm(), { wrapper: Wrapper });

    act(() => {
      queryClient.setQueryData(storyQueries.list("ws-1").queryKey, [
        {
          id: "story-1",
          title: undefined,
          description: undefined,
          date: "2026-02-03T00:00:00.000Z",
          thumbnailUrl: undefined,
          path: undefined,
          pathColor: undefined,
        },
      ] as unknown as Story[]);
    });

    await waitFor(() => expect(result.current.date).toBe("2026-02-03"));
    expect(result.current.title).toBe("");
    expect(result.current.description).toBe("");
    expect(result.current.pathColor).toBe(PATH_COLORS[0]);
    expect(result.current.path).toEqual([]);
    expect(result.current.previewUrl).toBeUndefined();
  });

  it("제목·설명이 비어있고 로그인 정보가 없으면 undefined와 빈 userId로 저장한다", async () => {
    createMutateAsync.mockResolvedValueOnce(undefined);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useStoryForm(), { wrapper: Wrapper });

    act(() => {
      result.current.setTitle("   ");
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(createMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ title: undefined, description: undefined, userId: "" })
    );
  });

  it("이미지 업로드에 성공하면 업로드된 URL로 저장한다", async () => {
    createMutateAsync.mockResolvedValueOnce(undefined);
    vi.mocked(storageApi.uploadImage).mockResolvedValueOnce("https://cdn.example.com/uploaded.jpg");
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData<User>(authQueries.user().queryKey, { id: "user-1", name: "테스트" });

    const { result } = renderHook(() => useStoryForm(), { wrapper: Wrapper });

    const file = new File(["content"], "photo.png", { type: "image/png" });
    const event = {
      target: { files: [file], value: "x" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    await act(async () => {
      await result.current.handleImageSelect(event);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(storageApi.uploadImage).toHaveBeenCalledWith(file, "user-1");
    expect(createMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ thumbnailUrl: "https://cdn.example.com/uploaded.jpg" })
    );
  });

  it("저장이 진행 중이면 handleSave 호출을 무시한다", async () => {
    let resolveCreate: () => void = () => {};
    createMutateAsync.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveCreate = resolve;
        })
    );
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useStoryForm(), { wrapper: Wrapper });

    let firstSave: Promise<void> = Promise.resolve();
    act(() => {
      firstSave = result.current.handleSave();
    });
    await waitFor(() => expect(result.current.isSaving).toBe(true));

    await act(async () => {
      await result.current.handleSave();
    });
    expect(createMutateAsync).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveCreate();
      await firstSave;
    });
    expect(result.current.isSaving).toBe(false);
  });
});

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ROUTES } from "@/constants/routes";
import { modalActions } from "@/stores/useModalStore";
import { toastActions } from "@/stores/useToastStore";
import { storyActions } from "@/features/stories/stores/useStoryStore";
import { useDeleteStoryMutation } from "@/features/stories/queries/storyMutations";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { StoryDetailView } from "./StoryDetailView";

import type { ModalConfig } from "@/types/modal";
import type { Story } from "@/features/stories/types/story";

vi.mock("next/navigation", () => ({ useRouter: vi.fn(), useParams: vi.fn() }));

vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));

vi.mock("@/stores/useModalStore", () => ({ modalActions: { showModal: vi.fn() } }));

vi.mock("@/stores/useToastStore", () => ({ toastActions: { showToast: vi.fn() } }));

vi.mock("@/features/stories/stores/useStoryStore", () => ({
  storyActions: { setSelectedStoryId: vi.fn() },
}));

vi.mock("@/features/stories/queries/storyQueries", () => ({
  storyQueries: {
    list: vi.fn((workspaceId: string) => ({ queryKey: ["stories", "list", workspaceId] })),
  },
}));

vi.mock("@/features/stories/queries/storyMutations", () => ({
  useDeleteStoryMutation: vi.fn(),
}));

vi.mock("@/features/workspace/hooks/useCurrentWorkspace", () => ({
  useCurrentWorkspace: vi.fn(),
}));

vi.mock("@/components/layout/AppHeader", () => ({
  AppHeader: ({ rightElement }: { rightElement?: React.ReactNode }) => (
    <header>{rightElement}</header>
  ),
}));

vi.mock("@/features/stories/components/StoryDetailContent", () => ({
  StoryDetailContent: ({ story }: { story: Story }) => (
    <div data-testid="detail-content">{story.title}</div>
  ),
}));

const mockUseRouter = vi.mocked(useRouter);
const mockUseParams = vi.mocked(useParams);
const mockUseQuery = vi.mocked(useQuery);
const mockUseCurrentWorkspace = vi.mocked(useCurrentWorkspace);
const mockUseDeleteStoryMutation = vi.mocked(useDeleteStoryMutation);
const mockShowModal = vi.mocked(modalActions.showModal);

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mutateAsync = vi.fn();

const story: Story = {
  id: "story-1",
  title: "제주 여행",
  date: "2026-03-05T00:00:00.000Z",
  path: [],
  pathColor: "#3182f6",
  userId: "user-1",
  workspaceId: "ws-1",
};

/** 라우트 파라미터와 스토리 목록 쿼리 결과를 세팅한다 */
const setup = (options?: { storyId?: string; stories?: Story[] }) => {
  mockUseParams.mockReturnValue({ id: options?.storyId ?? "story-1" });
  mockUseQuery.mockReturnValue({ data: options?.stories ?? [story] } as unknown as ReturnType<
    typeof useQuery
  >);
};

/** showModal에 전달된 마지막 모달 설정을 꺼낸다 */
const lastModalConfig = () =>
  mockShowModal.mock.calls[mockShowModal.mock.calls.length - 1][0] as ModalConfig;

describe("StoryDetailView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush, replace: mockReplace } as unknown as ReturnType<
      typeof useRouter
    >);
    mockUseCurrentWorkspace.mockReturnValue({
      currentWorkspace: { id: "ws-1" },
      workspaces: [],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCurrentWorkspace>);
    mutateAsync.mockResolvedValue(undefined);
    mockUseDeleteStoryMutation.mockReturnValue({ mutateAsync } as unknown as ReturnType<
      typeof useDeleteStoryMutation
    >);
  });

  it("해당 스토리를 찾으면 상세 본문을 렌더링한다", () => {
    setup();

    render(<StoryDetailView />);

    expect(screen.getByTestId("detail-content")).toHaveTextContent("제주 여행");
  });

  it("해당 스토리가 없으면 찾을 수 없다는 안내를 렌더링한다", () => {
    setup({ storyId: "unknown" });

    render(<StoryDetailView />);

    expect(screen.getByText("스토리를 찾을 수 없습니다.")).toBeInTheDocument();
    expect(screen.queryByTestId("detail-content")).not.toBeInTheDocument();
  });

  it("목록이 아직 비어 있으면 찾을 수 없다는 안내를 렌더링한다", () => {
    setup({ stories: [] });

    render(<StoryDetailView />);

    expect(screen.getByText("스토리를 찾을 수 없습니다.")).toBeInTheDocument();
  });

  it("수정 버튼을 클릭하면 storyId를 붙여 수정 화면으로 이동한다", () => {
    setup();

    render(<StoryDetailView />);
    fireEvent.click(screen.getByLabelText("스토리 수정"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.STORIES.EDIT.query({ storyId: "story-1" }));
  });

  it("삭제 버튼을 클릭하면 확인 모달을 띄운다", () => {
    setup();

    render(<StoryDetailView />);
    fireEvent.click(screen.getByLabelText("스토리 삭제"));

    const config = lastModalConfig();
    expect(config.type).toBe("confirm");
    expect(config.title).toBe("스토리 삭제");
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("삭제를 확인하면 스토리를 삭제하고 목록으로 이동한다", async () => {
    setup();

    render(<StoryDetailView />);
    fireEvent.click(screen.getByLabelText("스토리 삭제"));
    await lastModalConfig().onConfirm?.();

    expect(mutateAsync).toHaveBeenCalledWith("story-1");
    expect(storyActions.setSelectedStoryId).toHaveBeenCalledWith(null);
    expect(mockReplace).toHaveBeenCalledWith(ROUTES.STORIES.path);
  });

  it("삭제가 실패하면 에러 토스트를 띄우고 이동하지 않는다", async () => {
    setup();
    mutateAsync.mockRejectedValue(new Error("fail"));

    render(<StoryDetailView />);
    fireEvent.click(screen.getByLabelText("스토리 삭제"));
    await lastModalConfig().onConfirm?.();

    await waitFor(() =>
      expect(toastActions.showToast).toHaveBeenCalledWith(
        "스토리 삭제에 실패했습니다. 다시 시도해주세요.",
        "error"
      )
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

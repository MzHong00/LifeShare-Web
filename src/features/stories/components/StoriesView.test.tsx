import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ROUTES } from "@/constants/routes";
import { useQueryParams } from "@/hooks/useQueryParams";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { StoriesView } from "./StoriesView";

import type { Story } from "@/features/stories/types/story";

vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));

vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));

vi.mock("@/hooks/useQueryParams", () => ({ useQueryParams: vi.fn() }));

vi.mock("@/features/workspace/hooks/useCurrentWorkspace", () => ({
  useCurrentWorkspace: vi.fn(),
}));

vi.mock("@/features/stories/queries/storyQueries", () => ({
  storyQueries: {
    list: vi.fn((workspaceId: string) => ({ queryKey: ["stories", "list", workspaceId] })),
  },
}));

vi.mock("@/features/stories/components/StoryItem", () => ({
  StoryItem: ({ story, onPress }: { story: Story; onPress: (id: string) => void }) => (
    <button onClick={() => onPress(story.id)}>{story.title}</button>
  ),
}));

const mockUseRouter = vi.mocked(useRouter);
const mockUseQuery = vi.mocked(useQuery);
const mockUseQueryParams = vi.mocked(useQueryParams);
const mockUseCurrentWorkspace = vi.mocked(useCurrentWorkspace);

const stories: Story[] = [
  {
    id: "story-1",
    title: "제주 여행",
    date: "2026-01-01",
    path: [],
    pathColor: "#3182f6",
    userId: "user-1",
    workspaceId: "ws-1",
  },
  {
    id: "story-2",
    title: "부산 여행",
    date: "2026-02-01",
    path: [],
    pathColor: "#3182f6",
    userId: "user-1",
    workspaceId: "ws-1",
  },
];

const mockPush = vi.fn();
const setParams = { set: vi.fn(), toggle: vi.fn(), delete: vi.fn() };

/** 쿼리 데이터와 검색 쿼리스트링을 원하는 상태로 세팅한다 */
const setup = (options?: { stories?: Story[]; searchQuery?: string }) => {
  mockUseQuery.mockReturnValue({ data: options?.stories ?? stories } as unknown as ReturnType<
    typeof useQuery
  >);
  const params = new URLSearchParams(
    options?.searchQuery ? { q: options.searchQuery } : undefined
  ) as unknown as ReturnType<typeof useQueryParams>[0];
  mockUseQueryParams.mockReturnValue([params, setParams]);
};

describe("StoriesView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
    mockUseCurrentWorkspace.mockReturnValue({
      currentWorkspace: { id: "ws-1" },
      workspaces: [],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCurrentWorkspace>);
  });

  it("스토리 목록을 모두 렌더링한다", () => {
    setup();

    render(<StoriesView />);

    expect(screen.getByText("제주 여행")).toBeInTheDocument();
    expect(screen.getByText("부산 여행")).toBeInTheDocument();
  });

  it("스토리가 없으면 빈 상태와 첫 기록 링크를 렌더링한다", () => {
    setup({ stories: [] });

    render(<StoriesView />);

    expect(screen.getByText("아직 스토리가 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("첫 스토리 기록하기")).toBeInTheDocument();
  });

  it("검색어와 일치하는 스토리만 렌더링한다", () => {
    setup({ searchQuery: "제주" });

    render(<StoriesView />);

    expect(screen.getByText("제주 여행")).toBeInTheDocument();
    expect(screen.queryByText("부산 여행")).not.toBeInTheDocument();
  });

  it("검색 결과가 없으면 검색 전용 빈 상태를 렌더링한다", () => {
    setup({ searchQuery: "없는검색어" });

    render(<StoriesView />);

    expect(screen.getByText("검색 결과가 없습니다.")).toBeInTheDocument();
    expect(screen.queryByText("첫 스토리 기록하기")).not.toBeInTheDocument();
  });

  it("검색어를 입력하면 q 파라미터를 설정한다", () => {
    setup();

    render(<StoriesView />);
    fireEvent.change(screen.getByPlaceholderText("추억을 검색해보세요"), {
      target: { value: "제주" },
    });

    expect(setParams.set).toHaveBeenCalledWith("q", "제주");
  });

  it("검색어를 비우면 q 파라미터를 제거한다", () => {
    setup({ searchQuery: "제주" });

    render(<StoriesView />);
    fireEvent.change(screen.getByPlaceholderText("추억을 검색해보세요"), {
      target: { value: "" },
    });

    expect(setParams.delete).toHaveBeenCalledWith("q");
  });

  it("항목을 클릭하면 해당 스토리 상세로 이동한다", () => {
    setup();

    render(<StoriesView />);
    fireEvent.click(screen.getByText("제주 여행"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.STORIES.detail("story-1"));
  });

  it("뒤로가기 버튼을 클릭하면 보드로 이동한다", () => {
    setup();

    render(<StoriesView />);
    fireEvent.click(screen.getByLabelText("보드로 돌아가기"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.STORIES.path);
  });

  it("추가 버튼을 클릭하면 작성 화면으로 이동한다", () => {
    setup();

    render(<StoriesView />);
    fireEvent.click(screen.getByLabelText("스토리 추가"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.STORIES.EDIT.path);
  });
});

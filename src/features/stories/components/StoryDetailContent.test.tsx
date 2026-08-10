import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ROUTES } from "@/constants/routes";
import { storyActions } from "@/features/stories/stores/useStoryStore";
import { StoryDetailContent } from "./StoryDetailContent";

import type { Story } from "@/features/stories/types/story";

vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));

vi.mock("@/features/stories/stores/useStoryStore", () => ({
  storyActions: { setSelectedStoryId: vi.fn() },
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill: _fill, sizes: _sizes, alt, ...rest } = props;
    return <img data-testid="hero-image" alt={typeof alt === "string" ? alt : ""} {...rest} />;
  },
}));

const mockUseRouter = vi.mocked(useRouter);
const mockPush = vi.fn();

const story: Story = {
  id: "story-1",
  title: "제주 여행",
  description: "바다가 예뻤다",
  date: "2026-03-05T00:00:00.000Z",
  path: [{ latitude: 33.1, longitude: 126.5, timestamp: 1 }],
  pathColor: "#3182f6",
  thumbnailUrl: "https://example.com/a.png",
  userId: "user-1",
  workspaceId: "ws-1",
};

describe("StoryDetailContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
  });

  it("제목·설명·날짜·경로 지점 수를 렌더링한다", () => {
    render(<StoryDetailContent story={story} />);

    expect(screen.getByRole("heading", { name: "제주 여행" })).toBeInTheDocument();
    expect(screen.getByText("바다가 예뻤다")).toBeInTheDocument();
    expect(screen.getByText("2026.03.05")).toBeInTheDocument();
    expect(screen.getByText(/경로 1개 지점/)).toBeInTheDocument();
  });

  it("제목이 없으면 제목 없음으로 렌더링한다", () => {
    render(<StoryDetailContent story={{ ...story, title: undefined }} />);

    expect(screen.getByRole("heading", { name: "제목 없음" })).toBeInTheDocument();
  });

  it("설명이 없으면 설명을 렌더링하지 않는다", () => {
    render(<StoryDetailContent story={{ ...story, description: undefined }} />);

    expect(screen.queryByText("바다가 예뻤다")).not.toBeInTheDocument();
  });

  it("썸네일이 있으면 히어로 이미지를 렌더링한다", () => {
    render(<StoryDetailContent story={story} />);

    expect(screen.getByTestId("hero-image")).toHaveAttribute("src", story.thumbnailUrl);
  });

  it("썸네일이 없으면 히어로 이미지 대신 플레이스홀더를 렌더링한다", () => {
    render(<StoryDetailContent story={{ ...story, thumbnailUrl: undefined }} />);

    expect(screen.queryByTestId("hero-image")).not.toBeInTheDocument();
  });

  it("경로가 없으면 지점 수를 렌더링하지 않는다", () => {
    render(<StoryDetailContent story={{ ...story, path: [] }} />);

    expect(screen.queryByText(/개 지점/)).not.toBeInTheDocument();
  });

  it("지도에서 보기를 클릭하면 스토리를 선택하고 지도로 이동한다", () => {
    render(<StoryDetailContent story={story} />);
    fireEvent.click(screen.getByText("지도에서 경로 보기"));

    expect(storyActions.setSelectedStoryId).toHaveBeenCalledWith("story-1");
    expect(mockPush).toHaveBeenCalledWith(ROUTES.MAP.path);
  });

  it("예시(껍데기) 스토리면 안내와 기록하기 버튼을 렌더링한다", () => {
    render(<StoryDetailContent story={{ ...story, id: "shell-story-0" }} />);

    expect(screen.getByText("직접 기억 기록하기")).toBeInTheDocument();
    expect(screen.queryByText("지도에서 경로 보기")).not.toBeInTheDocument();
  });

  it("예시 스토리에서 기록하기를 클릭하면 작성 화면으로 이동한다", () => {
    render(<StoryDetailContent story={{ ...story, id: "shell-story-0" }} />);
    fireEvent.click(screen.getByText("직접 기억 기록하기"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.STORIES.EDIT.path);
    expect(storyActions.setSelectedStoryId).not.toHaveBeenCalled();
  });
});

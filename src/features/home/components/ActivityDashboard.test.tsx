import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { ROUTES } from "@/constants/routes";
import { useHomeStats } from "@/features/home/hooks/useHomeStats";
import { ActivityDashboard } from "./ActivityDashboard";

import type { Story } from "@/features/stories/types/story";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/features/home/hooks/useHomeStats", () => ({
  useHomeStats: vi.fn(),
}));

const mockUseRouter = vi.mocked(useRouter);
const mockUseHomeStats = vi.mocked(useHomeStats);

const FIXED_NOW = new Date("2026-08-03T09:00:00Z"); // D-day·날짜 포맷 결과 고정용 기준 시각

const story = {
  id: "story-1",
  title: "첫 여행",
  date: "2026-07-20",
  thumbnailUrl: "https://cdn.test/thumb.png",
} as unknown as Story;

/** useHomeStats 반환값을 원하는 상태로 세팅한다 */
const setStatsState = (state: { recentStories?: Story[]; isLoading?: boolean }) => {
  mockUseHomeStats.mockReturnValue({
    recentStories: state.recentStories ?? [],
    isLoading: state.isLoading ?? false,
  } as unknown as ReturnType<typeof useHomeStats>);
};

describe("ActivityDashboard", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    mockUseRouter.mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("로딩 중이면 스토리 목록 대신 스켈레톤을 렌더링한다", () => {
    setStatsState({ isLoading: true });

    render(<ActivityDashboard />);

    expect(screen.getByText("최근 기록한 순간")).toBeInTheDocument();
    expect(screen.queryByText("아직 함께한 스토리가 없어요")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("최근 스토리의 제목과 날짜를 렌더링한다", () => {
    setStatsState({ recentStories: [story] });

    render(<ActivityDashboard />);

    expect(screen.getByText("첫 여행")).toBeInTheDocument();
    expect(screen.getByText("2026. 07. 20")).toBeInTheDocument();
  });

  it("제목이 없는 스토리는 기본 제목으로 렌더링한다", () => {
    setStatsState({ recentStories: [{ ...story, title: "" } as unknown as Story] });

    render(<ActivityDashboard />);

    expect(screen.getByText("제목 없는 순간")).toBeInTheDocument();
  });

  it("스토리 카드를 클릭하면 스토리 상세로 이동한다", () => {
    setStatsState({ recentStories: [story] });

    render(<ActivityDashboard />);
    fireEvent.click(screen.getByText("첫 여행"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.STORIES.detail("story-1"));
  });

  it("최근 스토리가 없으면 빈 상태 안내를 렌더링한다", () => {
    setStatsState({ recentStories: [] });

    render(<ActivityDashboard />);

    expect(screen.getByText("아직 함께한 스토리가 없어요")).toBeInTheDocument();
    expect(screen.getByText("기록하기")).toBeInTheDocument();
  });

  it("빈 상태 카드를 클릭하면 스토리 목록으로 이동한다", () => {
    setStatsState({ recentStories: [] });

    render(<ActivityDashboard />);
    fireEvent.click(screen.getByText("기록하기"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.STORIES.path);
  });
});

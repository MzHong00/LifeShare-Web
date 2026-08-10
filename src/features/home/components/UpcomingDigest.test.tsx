import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { ROUTES } from "@/constants/routes";
import { useHomeDigest } from "@/features/home/hooks/useHomeDigest";
import { UpcomingDigest } from "./UpcomingDigest";

import type { CalendarEvent } from "@/features/calendar/types/calendar";
import type { Todo } from "@/features/todo/types/todo";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/features/home/hooks/useHomeDigest", () => ({
  useHomeDigest: vi.fn(),
}));

const mockUseRouter = vi.mocked(useRouter);
const mockUseHomeDigest = vi.mocked(useHomeDigest);

const FIXED_NOW = new Date("2026-08-03T09:00:00Z"); // 오늘/상대 날짜 라벨 고정용 기준 시각

const events = [
  { id: "event-1", title: "오늘 데이트", startDate: "2026-08-03", endDate: "2026-08-03" },
  { id: "event-2", title: "제주 여행", startDate: "2026-08-10", endDate: "2026-08-12" },
] as unknown as CalendarEvent[];

const todos = [
  { id: "todo-1", title: "장보기", startDate: "2026-08-03", endDate: "2026-08-03" },
  { id: "todo-2", title: "선물 준비", startDate: "2026-08-01", endDate: "2026-08-04" },
] as unknown as Todo[];

/** useHomeDigest 반환값을 원하는 상태로 세팅한다 */
const setDigestState = (state: {
  upcomingEvents?: CalendarEvent[];
  todayTodos?: Todo[];
  todayTodoTotal?: number;
}) => {
  const todayTodos = state.todayTodos ?? [];
  mockUseHomeDigest.mockReturnValue({
    upcomingEvents: state.upcomingEvents ?? [],
    todayTodos,
    todayTodoTotal: state.todayTodoTotal ?? todayTodos.length,
  } as unknown as ReturnType<typeof useHomeDigest>);
};

describe("UpcomingDigest", () => {
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

  it("다가오는 일정이 없으면 빈 상태 안내를 렌더링한다", () => {
    setDigestState({});

    render(<UpcomingDigest />);

    expect(screen.getByText("예정된 일정이 없어요")).toBeInTheDocument();
  });

  it("오늘 할 일이 없으면 빈 상태 안내를 렌더링한다", () => {
    setDigestState({});

    render(<UpcomingDigest />);

    expect(screen.getByText("오늘은 할 일이 없어요, 여유로운 하루 보내세요")).toBeInTheDocument();
  });

  it("다가오는 일정의 제목을 렌더링한다", () => {
    setDigestState({ upcomingEvents: events });

    render(<UpcomingDigest />);

    expect(screen.getByText("오늘 데이트")).toBeInTheDocument();
    expect(screen.getByText("제주 여행")).toBeInTheDocument();
  });

  it("오늘 시작하는 일정은 날짜 대신 오늘로 표시한다", () => {
    setDigestState({ upcomingEvents: events });

    render(<UpcomingDigest />);

    expect(screen.getByText("오늘")).toBeInTheDocument();
    expect(screen.getByText("8/10")).toBeInTheDocument();
  });

  it("오늘 할 일의 제목과 마감 라벨을 렌더링한다", () => {
    setDigestState({ todayTodos: todos });

    render(<UpcomingDigest />);

    expect(screen.getByText("장보기")).toBeInTheDocument();
    expect(screen.getByText("오늘까지")).toBeInTheDocument();
    expect(screen.getByText("선물 준비")).toBeInTheDocument();
    expect(screen.getByText("내일까지")).toBeInTheDocument();
  });

  it("노출 개수를 초과한 할 일 수를 더보기로 표시한다", () => {
    setDigestState({ todayTodos: todos, todayTodoTotal: 5 });

    render(<UpcomingDigest />);

    expect(screen.getByText("외 3개 더 있어요")).toBeInTheDocument();
  });

  it("초과분이 없으면 더보기를 표시하지 않는다", () => {
    setDigestState({ todayTodos: todos });

    render(<UpcomingDigest />);

    expect(screen.queryByText(/더 있어요/)).not.toBeInTheDocument();
  });

  it("일정 헤더를 클릭하면 캘린더로 이동한다", () => {
    setDigestState({});

    render(<UpcomingDigest />);
    fireEvent.click(screen.getByRole("button", { name: "다가오는 일정, 캘린더로 이동" }));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.CALENDAR.path);
  });

  it("할 일 헤더를 클릭하면 할 일 목록으로 이동한다", () => {
    setDigestState({});

    render(<UpcomingDigest />);
    fireEvent.click(screen.getByRole("button", { name: "오늘 할 일, 할 일 목록으로 이동" }));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.TODO.path);
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { useCalendar } from "@/features/calendar/hooks/useCalendar";
import { ROUTES } from "@/constants/routes";
import { getCalendarDays } from "@/utils/date";
import { CalendarView } from "./CalendarView";

const FIXED_NOW = new Date("2026-08-04T09:00:00+09:00"); // 날짜 계산 고정 기준 시각

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/features/calendar/hooks/useCalendar", () => ({
  useCalendar: vi.fn(),
}));

vi.mock("@/components/layout/AppHeader", () => ({
  AppHeader: () => <header />,
}));

vi.mock("@/features/todo/components/TodoList", () => ({
  TodoList: ({
    isPending,
    isError,
    todos,
  }: {
    isPending: boolean;
    isError: boolean;
    todos: unknown[];
  }) => (
    <div>
      {isPending && <p>할 일 로딩 중</p>}
      {isError && <p>할 일 조회 실패</p>}
      <p>할 일 {todos.length}건</p>
    </div>
  ),
}));

const mockUseRouter = vi.mocked(useRouter);
const mockUseCalendar = vi.mocked(useCalendar);

const mockSelectDate = vi.fn();
const mockMoveMonth = vi.fn();

/** useCalendar 반환값을 원하는 상태로 세팅한다 */
const setCalendarState = (state: Partial<ReturnType<typeof useCalendar>> = {}) => {
  mockUseCalendar.mockReturnValue({
    today: "2026-08-04",
    selectedDate: "2026-08-04",
    currentMonth: "2026-08",
    filter: "all",
    setFilter: vi.fn(),
    markedDates: {},
    calendarDays: getCalendarDays("2026-08"),
    selectedDateTodos: [],
    isTodosPending: false,
    isTodosError: false,
    currentWorkspace: null,
    selectDate: mockSelectDate,
    moveMonth: mockMoveMonth,
    toggleTodo: vi.fn(),
    ...state,
  } as unknown as ReturnType<typeof useCalendar>);
};

describe("CalendarView", () => {
  const mockPush = vi.fn();

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
    setCalendarState();
  });

  it("표시 중인 월과 선택일 할 일 제목을 렌더링한다", () => {
    render(<CalendarView />);

    expect(screen.getByText("2026년 8월")).toBeInTheDocument();
    expect(screen.getByText("8월 4일 할 일")).toBeInTheDocument();
  });

  it("할 일 로딩 중이면 로딩 상태를 전달한다", () => {
    setCalendarState({ isTodosPending: true });

    render(<CalendarView />);

    expect(screen.getByText("할 일 로딩 중")).toBeInTheDocument();
    expect(screen.queryByText("할 일 조회 실패")).not.toBeInTheDocument();
  });

  it("할 일 조회 실패 시 에러 상태를 전달한다", () => {
    setCalendarState({ isTodosError: true });

    render(<CalendarView />);

    expect(screen.getByText("할 일 조회 실패")).toBeInTheDocument();
    expect(screen.queryByText("할 일 로딩 중")).not.toBeInTheDocument();
  });

  it("선택일의 할 일 목록을 TodoList에 전달한다", () => {
    setCalendarState({
      selectedDateTodos: [{ id: "t-1" }, { id: "t-2" }] as unknown as ReturnType<
        typeof useCalendar
      >["selectedDateTodos"],
    });

    render(<CalendarView />);

    expect(screen.getByText("할 일 2건")).toBeInTheDocument();
  });

  it("이전 달 버튼을 클릭하면 moveMonth를 -1로 호출한다", () => {
    render(<CalendarView />);

    fireEvent.click(screen.getByLabelText("이전 달"));

    expect(mockMoveMonth).toHaveBeenCalledWith(-1);
  });

  it("다음 달 버튼을 클릭하면 moveMonth를 1로 호출한다", () => {
    render(<CalendarView />);

    fireEvent.click(screen.getByLabelText("다음 달"));

    expect(mockMoveMonth).toHaveBeenCalledWith(1);
  });

  it("날짜 칸을 클릭하면 해당 날짜로 selectDate를 호출한다", () => {
    setCalendarState({ calendarDays: ["2026-08-01", "2026-08-02"] });

    render(<CalendarView />);
    fireEvent.click(screen.getByText("2"));

    expect(mockSelectDate).toHaveBeenCalledWith("2026-08-02");
  });

  it("일정 추가 버튼을 클릭하면 선택일을 초기값으로 할 일 생성 화면으로 이동한다", () => {
    setCalendarState({ selectedDate: "2026-08-20" });

    render(<CalendarView />);
    fireEvent.click(screen.getByLabelText("일정 추가"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.TODO.CREATE.query({ initialDate: "2026-08-20" }));
  });

  it("일정이 있는 날짜에는 색상 점을 표시한다", () => {
    setCalendarState({
      calendarDays: ["2026-08-01", "2026-08-02"],
      markedDates: { "2026-08-01": ["rgb(1, 2, 3)"] },
    });

    render(<CalendarView />);
    const [first, second] = screen.getAllByRole("button").slice(3);

    expect(first.querySelectorAll("div")).toHaveLength(2);
    expect(second.querySelectorAll("div")).toHaveLength(0);
  });
});

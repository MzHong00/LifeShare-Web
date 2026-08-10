import { render, screen, fireEvent } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { getCalendarDays } from "@/utils/date";
import { CalendarGrid } from "./CalendarGrid";

const FIXED_NOW = new Date("2026-08-04T09:00:00+09:00"); // 날짜 계산 고정 기준 시각

/** 기본 props에 부분 값을 덮어 렌더링한다 */
const renderGrid = (props: Partial<React.ComponentProps<typeof CalendarGrid>> = {}) =>
  render(
    <CalendarGrid
      days={getCalendarDays("2026-08")}
      selectedDate="2026-08-04"
      today="2026-08-04"
      markedDates={{}}
      onSelectDate={vi.fn()}
      {...props}
    />
  );

describe("CalendarGrid", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("요일 헤더 7개를 렌더링한다", () => {
    renderGrid();

    ["일", "월", "화", "수", "목", "금", "토"].forEach((day) => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it("해당 월의 날짜 수만큼 날짜 버튼을 렌더링한다", () => {
    renderGrid({ days: getCalendarDays("2026-08") });

    // 2026년 8월은 31일까지
    expect(screen.getAllByRole("button")).toHaveLength(31);
  });

  it("월 첫날 요일만큼 앞쪽 빈 칸을 렌더링한다", () => {
    // 2026-09-01은 화요일 → 앞쪽 빈 칸 2개
    const { container } = renderGrid({
      days: getCalendarDays("2026-09"),
      selectedDate: "2026-09-01",
    });

    expect(screen.getAllByRole("button")).toHaveLength(30);
    expect(container.querySelectorAll("div:empty")).toHaveLength(2);
  });

  it("null이 섞인 셀 배열에서 날짜 칸만 버튼으로 렌더링한다", () => {
    renderGrid({ days: [null, "2026-08-01", null, "2026-08-02"] });

    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("markedDates에 등록된 날짜에만 색상 점을 표시한다", () => {
    const { container } = renderGrid({
      days: ["2026-08-01", "2026-08-02"],
      markedDates: { "2026-08-01": ["rgb(1, 2, 3)"] },
    });
    const buttons = screen.getAllByRole("button");

    expect(buttons[0].querySelectorAll("div")).toHaveLength(2);
    expect(buttons[1].querySelectorAll("div")).toHaveLength(0);
    expect(container.textContent).toContain("1");
  });

  it("선택된 날짜와 오늘 날짜 셀의 클래스가 서로 다르다", () => {
    renderGrid({
      days: ["2026-08-04", "2026-08-05"],
      selectedDate: "2026-08-05",
      today: "2026-08-04",
    });
    const [todayCell, selectedCell] = screen.getAllByRole("button");

    expect(todayCell.querySelector("span")?.className).not.toBe(
      selectedCell.querySelector("span")?.className
    );
  });

  it("날짜 칸을 클릭하면 해당 날짜로 onSelectDate를 호출한다", () => {
    const onSelectDate = vi.fn();
    renderGrid({ days: ["2026-08-11"], onSelectDate });

    fireEvent.click(screen.getByRole("button"));

    expect(onSelectDate).toHaveBeenCalledWith("2026-08-11");
  });
});

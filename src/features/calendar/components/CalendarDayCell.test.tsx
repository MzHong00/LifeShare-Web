import { render, screen, fireEvent } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { CalendarDayCell } from "./CalendarDayCell";

const FIXED_NOW = new Date("2026-08-04T09:00:00+09:00"); // 날짜 계산 고정 기준 시각

/** 기본 props에 부분 값을 덮어 렌더링한다 */
const renderCell = (props: Partial<React.ComponentProps<typeof CalendarDayCell>> = {}) =>
  render(
    <CalendarDayCell
      date="2026-08-04"
      isSelected={false}
      isToday={false}
      dotColors={[]}
      onSelect={vi.fn()}
      {...props}
    />
  );

describe("CalendarDayCell", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("날짜의 일(day) 숫자를 표시한다", () => {
    renderCell({ date: "2026-08-17" });

    expect(screen.getByText("17")).toBeInTheDocument();
  });

  it("일정이 없으면 색상 점을 렌더링하지 않는다", () => {
    const { container } = renderCell({ dotColors: [] });

    expect(container.querySelectorAll("div")).toHaveLength(0);
  });

  it("일정 색상 개수만큼 점을 렌더링한다", () => {
    const { container } = renderCell({ dotColors: ["#f00", "#0f0"] });

    // dots 컨테이너 1개 + 점 2개
    expect(container.querySelectorAll("div")).toHaveLength(3);
  });

  it("일정이 3개를 넘으면 점을 최대 3개까지만 렌더링한다", () => {
    const { container } = renderCell({ dotColors: ["#1", "#2", "#3", "#4", "#5"] });

    expect(container.querySelectorAll("div")).toHaveLength(4);
  });

  it("선택되지 않은 셀의 점에는 일정 색상을 입힌다", () => {
    const { container } = renderCell({ dotColors: ["rgb(255, 0, 0)"] });
    const dot = container.querySelectorAll("div")[1] as HTMLElement;

    expect(dot.style.getPropertyValue("--dot-color")).toBe("rgb(255, 0, 0)");
  });

  it("선택된 셀의 점에는 인라인 색상을 입히지 않는다", () => {
    const { container } = renderCell({ isSelected: true, dotColors: ["rgb(255, 0, 0)"] });
    const dot = container.querySelectorAll("div")[1] as HTMLElement;

    expect(dot.style.getPropertyValue("--dot-color")).toBe("");
  });

  it("선택된 셀과 선택되지 않은 셀의 숫자 클래스가 다르다", () => {
    const { container: selected } = renderCell({ isSelected: true });
    const { container: normal } = renderCell({ isSelected: false });

    expect(selected.querySelector("span")?.className).not.toBe(
      normal.querySelector("span")?.className
    );
  });

  it("오늘이면서 선택되지 않은 셀은 오늘 스타일 클래스를 갖는다", () => {
    const { container: today } = renderCell({ isToday: true });
    const { container: normal } = renderCell({ isToday: false });

    expect(today.querySelector("span")?.className).not.toBe(
      normal.querySelector("span")?.className
    );
  });

  it("선택된 셀은 오늘 여부와 무관하게 같은 클래스를 갖는다", () => {
    const { container: selectedToday } = renderCell({ isSelected: true, isToday: true });
    const { container: selectedOnly } = renderCell({ isSelected: true, isToday: false });

    expect(selectedToday.querySelector("span")?.className).toBe(
      selectedOnly.querySelector("span")?.className
    );
  });

  it("일요일·토요일·평일의 숫자 클래스를 각각 구분한다", () => {
    const { container: sunday } = renderCell({ date: "2026-08-02" });
    const { container: saturday } = renderCell({ date: "2026-08-01" });
    const { container: weekday } = renderCell({ date: "2026-08-03" });

    const classes = [sunday, saturday, weekday].map((c) => c.querySelector("span")?.className);

    expect(new Set(classes).size).toBe(3);
  });

  it("클릭하면 해당 날짜로 onSelect를 호출한다", () => {
    const onSelect = vi.fn();
    renderCell({ date: "2026-08-21", onSelect });

    fireEvent.click(screen.getByRole("button"));

    expect(onSelect).toHaveBeenCalledWith("2026-08-21");
  });
});

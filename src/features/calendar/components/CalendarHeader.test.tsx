import { render, screen, fireEvent } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { CalendarHeader } from "./CalendarHeader";

const FIXED_NOW = new Date("2026-08-04T09:00:00+09:00"); // 날짜 계산 고정 기준 시각

/** 기본 props에 부분 값을 덮어 렌더링한다 */
const renderHeader = (props: Partial<React.ComponentProps<typeof CalendarHeader>> = {}) =>
  render(
    <CalendarHeader currentMonth="2026-08" onMoveMonth={vi.fn()} onAddEvent={vi.fn()} {...props} />
  );

describe("CalendarHeader", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("표시 중인 월을 '연년 M월' 형식으로 렌더링한다", () => {
    renderHeader({ currentMonth: "2026-08" });

    expect(screen.getByText("2026년 8월")).toBeInTheDocument();
  });

  it("연도가 바뀐 월도 그대로 반영해 렌더링한다", () => {
    renderHeader({ currentMonth: "2025-12" });

    expect(screen.getByText("2025년 12월")).toBeInTheDocument();
  });

  it("이전 달 버튼을 클릭하면 delta -1로 onMoveMonth를 호출한다", () => {
    const onMoveMonth = vi.fn();
    renderHeader({ onMoveMonth });

    fireEvent.click(screen.getByLabelText("이전 달"));

    expect(onMoveMonth).toHaveBeenCalledWith(-1);
  });

  it("다음 달 버튼을 클릭하면 delta 1로 onMoveMonth를 호출한다", () => {
    const onMoveMonth = vi.fn();
    renderHeader({ onMoveMonth });

    fireEvent.click(screen.getByLabelText("다음 달"));

    expect(onMoveMonth).toHaveBeenCalledWith(1);
  });

  it("일정 추가 버튼을 클릭하면 onAddEvent를 호출한다", () => {
    const onAddEvent = vi.fn();
    const onMoveMonth = vi.fn();
    renderHeader({ onAddEvent, onMoveMonth });

    fireEvent.click(screen.getByLabelText("일정 추가"));

    expect(onAddEvent).toHaveBeenCalledTimes(1);
    expect(onMoveMonth).not.toHaveBeenCalled();
  });

  it("월 이동·일정 추가 버튼 3개를 렌더링한다", () => {
    renderHeader();

    expect(screen.getAllByRole("button")).toHaveLength(3);
  });
});

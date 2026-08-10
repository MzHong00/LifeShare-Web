import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DatePicker } from "./DatePicker";

const TODAY = "2026-08-04"; // 고정한 오늘 날짜 (테스트 재현성 확보)
const CALENDAR_GRID_CELL_COUNT = 42; // 컴포넌트가 고정으로 유지하는 6주 그리드 셀 수

/** 날짜 셀 버튼 목록 (요일 라벨은 button이 아니므로 제외된다) */
const getDayButtons = () =>
  screen.getAllByRole("button").filter((button) => /^\d+$/.test(button.textContent ?? ""));

describe("DatePicker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`${TODAY}T09:00:00`));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initialDate가 속한 월을 헤더에 표시한다", () => {
    render(<DatePicker initialDate="2026-03-15" onChangeDate={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "2026년 3월" })).toBeInTheDocument();
  });

  it("initialDate가 비어 있으면 오늘이 속한 월을 표시한다", () => {
    render(<DatePicker initialDate="" onChangeDate={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "2026년 8월" })).toBeInTheDocument();
  });

  it("initialDate에 해당하는 날짜를 선택 상태로 렌더링한다", () => {
    render(<DatePicker initialDate="2026-03-15" onChangeDate={vi.fn()} />);

    const selected = getDayButtons().find((button) => button.textContent === "15");
    expect(selected?.firstElementChild?.className).toMatch(/dayNumberSelected/);
  });

  it("날짜를 클릭하면 onChangeDate에 해당 날짜가 전달된다", () => {
    const onChangeDate = vi.fn();
    render(<DatePicker initialDate="2026-03-15" onChangeDate={onChangeDate} />);

    fireEvent.click(screen.getByText("20"));

    expect(onChangeDate).toHaveBeenCalledWith("2026-03-20");
  });

  it("날짜를 클릭하면 선택 상태가 클릭한 날짜로 이동한다", () => {
    render(<DatePicker initialDate="2026-03-15" onChangeDate={vi.fn()} />);

    fireEvent.click(screen.getByText("20"));

    const dayButtons = getDayButtons();
    expect(
      dayButtons.find((button) => button.textContent === "15")?.firstElementChild?.className
    ).not.toMatch(/dayNumberSelected/);
    expect(
      dayButtons.find((button) => button.textContent === "20")?.firstElementChild?.className
    ).toMatch(/dayNumberSelected/);
  });

  it("오늘 날짜 셀에 today 스타일을 적용한다", () => {
    render(<DatePicker initialDate={TODAY} onChangeDate={vi.fn()} />);

    fireEvent.click(screen.getByText("10"));

    const todayCell = getDayButtons().find((button) => button.textContent === "4");
    expect(todayCell?.firstElementChild?.className).toMatch(/dayNumberToday/);
  });

  it("다음 달 버튼을 누르면 다음 달로 이동한다", () => {
    render(<DatePicker initialDate="2026-03-15" onChangeDate={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "다음 달" }));

    expect(screen.getByRole("heading", { name: "2026년 4월" })).toBeInTheDocument();
  });

  it("이전 달 버튼을 누르면 이전 달로 이동한다", () => {
    render(<DatePicker initialDate="2026-03-15" onChangeDate={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "이전 달" }));

    expect(screen.getByRole("heading", { name: "2026년 2월" })).toBeInTheDocument();
  });

  it("연말에서 다음 달로 이동하면 해가 넘어간다", () => {
    render(<DatePicker initialDate="2026-12-31" onChangeDate={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "다음 달" }));

    expect(screen.getByRole("heading", { name: "2027년 1월" })).toBeInTheDocument();
  });

  it("월말 날짜로 열어도 이동한 달의 마지막 날까지만 렌더링한다", () => {
    render(<DatePicker initialDate="2026-01-31" onChangeDate={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "다음 달" }));

    expect(screen.getByRole("heading", { name: "2026년 2월" })).toBeInTheDocument();
    expect(screen.getByText("28")).toBeInTheDocument();
    expect(screen.queryByText("29")).not.toBeInTheDocument();
  });

  it("윤년 2월은 29일까지 렌더링한다", () => {
    render(<DatePicker initialDate="2024-02-10" onChangeDate={vi.fn()} />);

    expect(screen.getByText("29")).toBeInTheDocument();
    expect(screen.queryByText("30")).not.toBeInTheDocument();
  });

  it("월과 무관하게 그리드 셀 개수를 42개로 유지한다", () => {
    const { container } = render(<DatePicker initialDate="2026-02-10" onChangeDate={vi.fn()} />);

    const grid = container.querySelector("div[class^='_days_']");
    expect(grid?.children).toHaveLength(CALENDAR_GRID_CELL_COUNT);

    fireEvent.click(screen.getByRole("button", { name: "다음 달" }));
    expect(grid?.children).toHaveLength(CALENDAR_GRID_CELL_COUNT);
  });

  it("월을 이동해도 선택된 날짜는 유지된다", () => {
    const onChangeDate = vi.fn();
    render(<DatePicker initialDate="2026-03-15" onChangeDate={onChangeDate} />);

    fireEvent.click(screen.getByRole("button", { name: "다음 달" }));
    fireEvent.click(screen.getByRole("button", { name: "이전 달" }));

    expect(
      getDayButtons().find((button) => button.textContent === "15")?.firstElementChild?.className
    ).toMatch(/dayNumberSelected/);
    expect(onChangeDate).not.toHaveBeenCalled();
  });

  it("요일 라벨을 일요일부터 순서대로 렌더링한다", () => {
    render(<DatePicker initialDate="2026-03-15" onChangeDate={vi.fn()} />);

    ["일", "월", "화", "수", "목", "금", "토"].forEach((day) => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });
});

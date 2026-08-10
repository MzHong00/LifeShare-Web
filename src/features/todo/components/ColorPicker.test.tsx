import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { TODO_COLORS } from "@/constants/theme";

import { ColorPicker } from "./ColorPicker";

describe("ColorPicker", () => {
  const onSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("모든 색상 옵션을 버튼으로 렌더링한다", () => {
    render(<ColorPicker selectedColor={TODO_COLORS[0]} onSelect={onSelect} />);

    expect(screen.getAllByRole("button")).toHaveLength(TODO_COLORS.length);
  });

  it("각 버튼에 해당 색상을 CSS 변수로 전달한다", () => {
    render(<ColorPicker selectedColor={TODO_COLORS[0]} onSelect={onSelect} />);

    expect(screen.getAllByRole("button")[1].getAttribute("style")).toContain(TODO_COLORS[1]);
  });

  it("색상을 클릭하면 해당 색상으로 onSelect를 호출한다", () => {
    render(<ColorPicker selectedColor={TODO_COLORS[0]} onSelect={onSelect} />);
    fireEvent.click(screen.getAllByRole("button")[2]);

    expect(onSelect).toHaveBeenCalledWith(TODO_COLORS[2]);
  });

  it("선택된 색상 버튼에만 선택 클래스를 적용한다", () => {
    render(<ColorPicker selectedColor={TODO_COLORS[1]} onSelect={onSelect} />);
    const buttons = screen.getAllByRole("button");

    expect(buttons[1].className).not.toBe(buttons[0].className);
  });

  it("selectedColor가 목록에 없으면 어떤 버튼도 선택 표시하지 않는다", () => {
    render(<ColorPicker selectedColor="#000000" onSelect={onSelect} />);
    const classNames = screen.getAllByRole("button").map((button) => button.className);

    expect(new Set(classNames).size).toBe(1);
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { WorkspaceThemePicker } from "./WorkspaceThemePicker";

import type { ThemeColor } from "@/features/workspace/types/workspace";

const THEME_LABELS = [
  "핑크 오로라",
  "블루 오로라",
  "트와일라잇 오로라",
  "옐로 오로라",
  "그린 오로라",
];

describe("WorkspaceThemePicker", () => {
  const onChange = vi.fn();

  /** 지정한 테마가 선택된 상태로 렌더링한다 */
  const renderPicker = (value: ThemeColor = "pink") =>
    render(<WorkspaceThemePicker value={value} onChange={onChange} />);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("모든 테마 색상 옵션을 렌더링한다", () => {
    renderPicker();

    expect(screen.getAllByRole("button")).toHaveLength(THEME_LABELS.length);
    THEME_LABELS.forEach((label) => {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    });
  });

  it("현재 선택된 색상을 data-theme으로 표시한다", () => {
    renderPicker("green");

    expect(screen.getByRole("button", { name: "그린 오로라" })).toHaveAttribute(
      "data-theme",
      "green"
    );
  });

  it("다른 색상을 선택하면 해당 색상으로 onChange를 호출한다", () => {
    renderPicker("pink");
    fireEvent.click(screen.getByRole("button", { name: "블루 오로라" }));

    expect(onChange).toHaveBeenCalledWith("blue");
  });

  it("이미 선택된 색상을 클릭해도 동일 색상으로 onChange를 호출한다", () => {
    renderPicker("yellow");
    fireEvent.click(screen.getByRole("button", { name: "옐로 오로라" }));

    expect(onChange).toHaveBeenCalledWith("yellow");
  });
});

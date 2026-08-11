import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { getDateWithOffset } from "@/utils/date";

import { TodoItem } from "./TodoItem";

import type { Todo } from "@/features/todo/types/todo";
import type { WorkspaceMember } from "@/features/workspace/types/workspace";

const today = getDateWithOffset(0);

const todo = {
  id: "todo-1",
  workspaceId: "workspace-1",
  title: "장보기",
  isCompleted: false,
  startDate: today,
  endDate: today,
  color: "#3182F6",
  createdAt: today,
} as unknown as Todo;

const assignee = {
  id: "user-1",
  name: "홍길동",
  email: "me@test.com",
  role: "owner",
} as unknown as WorkspaceMember;

describe("TodoItem", () => {
  const onToggle = vi.fn();
  const onPress = vi.fn();

  /** 주어진 할 일 오버라이드로 렌더링한다 */
  const renderItem = (overrides: Partial<Todo> = {}, member?: WorkspaceMember) =>
    render(
      <TodoItem
        item={{ ...todo, ...overrides }}
        assignee={member}
        onToggle={onToggle}
        onPress={onPress}
      />
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("제목과 종료일 라벨을 렌더링한다", () => {
    renderItem();

    expect(screen.getByText("장보기")).toBeInTheDocument();
    expect(screen.getByText("오늘까지")).toBeInTheDocument();
  });

  it("미완료면 완료 처리 버튼을 노출하고 완료 배지를 숨긴다", () => {
    renderItem({ isCompleted: false });

    expect(screen.getByRole("button", { name: "완료 처리" })).toBeInTheDocument();
    expect(screen.queryByText("완료")).not.toBeInTheDocument();
  });

  it("완료면 완료 취소 버튼과 완료 배지를 노출한다", () => {
    renderItem({ isCompleted: true });

    expect(screen.getByRole("button", { name: "완료 취소" })).toBeInTheDocument();
    expect(screen.getByText("완료")).toBeInTheDocument();
  });

  it("토글 버튼을 클릭하면 항목 id로 onToggle을 호출한다", () => {
    renderItem();
    fireEvent.click(screen.getByRole("button", { name: "완료 처리" }));

    expect(onToggle).toHaveBeenCalledWith("todo-1");
    expect(onPress).not.toHaveBeenCalled();
  });

  it("본문을 클릭하면 항목 id로 onPress를 호출한다", () => {
    renderItem();
    fireEvent.click(screen.getByText("장보기"));

    expect(onPress).toHaveBeenCalledWith("todo-1");
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("미완료 항목의 원형 마커에 항목 색상을 적용한다", () => {
    const { container } = renderItem({ color: "#F04452" });
    const circle = container.querySelector<HTMLElement>("[style*='border-color']");

    expect(circle?.style.getPropertyValue("--circle-border-color")).toBe("#F04452");
  });

  it("담당자가 있으면 담당자 이니셜을 렌더링한다", () => {
    renderItem({}, assignee);

    expect(screen.getByText("홍")).toBeInTheDocument();
  });

  it("담당자가 없으면 담당자 영역을 렌더링하지 않는다", () => {
    renderItem();

    expect(screen.queryByText("홍")).not.toBeInTheDocument();
  });

  it("미완료이고 마감이 지났으면 지연 라벨을 노출한다", () => {
    renderItem({ isCompleted: false, endDate: getDateWithOffset(-3) });

    expect(screen.getByText("3일 지연")).toBeInTheDocument();
  });

  it("종료일이 미래면 날짜 형식 라벨을 노출한다", () => {
    renderItem({ endDate: getDateWithOffset(5) });

    expect(screen.getByText(/까지$/)).toBeInTheDocument();
  });
});

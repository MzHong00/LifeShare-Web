import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ROUTES } from "@/constants/routes";
import { getDateWithOffset } from "@/utils/date";

import { TodoList } from "./TodoList";

import type { Filter } from "@/features/todo/hooks/useFilteredTodos";
import type { Todo } from "@/features/todo/types/todo";
import type { Workspace } from "@/features/workspace/types/workspace";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

const mockUseRouter = vi.mocked(useRouter);

const today = getDateWithOffset(0);

/** 테스트용 할 일 객체를 만든다 */
const makeTodo = (id: string, title: string, isCompleted: boolean, assigneeId?: string): Todo =>
  ({
    id,
    workspaceId: "workspace-1",
    title,
    isCompleted,
    assigneeId,
    startDate: today,
    endDate: today,
    createdAt: today,
  }) as unknown as Todo;

const workspace = {
  id: "workspace-1",
  name: "우리집",
  members: [{ id: "user-1", name: "홍길동", email: "me@test.com", role: "owner" }],
} as unknown as Workspace;

describe("TodoList", () => {
  const mockPush = vi.fn();
  const onFilterChange = vi.fn();
  const onToggle = vi.fn();

  /** 기본 props로 렌더링한다 */
  const renderList = (
    props: {
      todos?: Todo[];
      filter?: Filter;
      isPending?: boolean;
      isError?: boolean;
      initialDate?: string;
      currentWorkspace?: Workspace | null;
    } = {}
  ) =>
    render(
      <TodoList
        todos={props.todos ?? []}
        currentWorkspace={props.currentWorkspace === undefined ? workspace : props.currentWorkspace}
        initialDate={props.initialDate}
        filter={props.filter ?? "all"}
        isPending={props.isPending}
        isError={props.isError}
        onFilterChange={onFilterChange}
        onToggle={onToggle}
      />
    );

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
  });

  it("필터 탭 3개를 렌더링한다", () => {
    renderList();

    expect(screen.getByText("전체")).toBeInTheDocument();
    expect(screen.getByText("진행 중")).toBeInTheDocument();
    expect(screen.getByText("완료")).toBeInTheDocument();
  });

  it("필터 탭을 클릭하면 해당 필터로 onFilterChange를 호출한다", () => {
    renderList();
    fireEvent.click(screen.getByText("진행 중"));

    expect(onFilterChange).toHaveBeenCalledWith("active");
  });

  it("현재 필터 탭만 활성 스타일로 표시한다", () => {
    renderList({ filter: "active" });

    expect(screen.getByText("진행 중").className).not.toBe(screen.getByText("전체").className);
  });

  it("로딩 중이면 항목과 빈 상태 대신 스켈레톤을 렌더링한다", () => {
    renderList({ todos: [makeTodo("1", "장보기", false)], isPending: true });

    expect(screen.queryByText("장보기")).not.toBeInTheDocument();
    expect(screen.queryByText("할 일이 없습니다.")).not.toBeInTheDocument();
  });

  it("조회 실패 시 에러 안내를 렌더링한다", () => {
    renderList({ isError: true });

    expect(screen.getByText("할 일 목록을 불러오지 못했습니다.")).toBeInTheDocument();
    expect(screen.queryByText("할 일이 없습니다.")).not.toBeInTheDocument();
  });

  it("표시할 항목이 없으면 빈 상태와 추가 버튼을 렌더링한다", () => {
    renderList({ todos: [] });

    expect(screen.getByText("할 일이 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("할 일 추가하기")).toBeInTheDocument();
  });

  it("완료 필터의 빈 상태에서는 추가 버튼을 숨긴다", () => {
    renderList({ todos: [makeTodo("1", "장보기", false)], filter: "completed" });

    expect(screen.getByText("완료된 할 일이 없습니다.")).toBeInTheDocument();
    expect(screen.queryByText("할 일 추가하기")).not.toBeInTheDocument();
  });

  it("빈 상태의 추가 버튼을 클릭하면 생성 화면으로 이동한다", () => {
    renderList({ todos: [] });
    fireEvent.click(screen.getByText("할 일 추가하기"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.TODO.CREATE.path);
  });

  it("initialDate가 있으면 해당 날짜를 쿼리로 붙여 생성 화면으로 이동한다", () => {
    renderList({ todos: [], initialDate: "2026-08-01" });
    fireEvent.click(screen.getByText("할 일 추가하기"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.TODO.CREATE.query({ initialDate: "2026-08-01" }));
  });

  it("필터를 통과한 항목만 렌더링한다", () => {
    renderList({
      todos: [makeTodo("1", "장보기", false), makeTodo("2", "청소", true)],
      filter: "active",
    });

    expect(screen.getByText("장보기")).toBeInTheDocument();
    expect(screen.queryByText("청소")).not.toBeInTheDocument();
  });

  it("항목의 토글 버튼을 클릭하면 항목 id로 onToggle을 호출한다", () => {
    renderList({ todos: [makeTodo("1", "장보기", false)] });
    fireEvent.click(screen.getByRole("button", { name: "완료 처리" }));

    expect(onToggle).toHaveBeenCalledWith("1");
  });

  it("항목 본문을 클릭하면 수정 화면으로 이동한다", () => {
    renderList({ todos: [makeTodo("1", "장보기", false)] });
    fireEvent.click(screen.getByText("장보기"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.TODO.CREATE.query({ todoId: "1" }));
  });

  it("담당자가 지정된 항목에는 담당자 아바타를 함께 렌더링한다", () => {
    renderList({ todos: [makeTodo("1", "장보기", false, "user-1")] });

    expect(screen.getByText("홍")).toBeInTheDocument();
  });

  it("담당자가 워크스페이스 멤버에 없으면 아바타를 렌더링하지 않는다", () => {
    renderList({ todos: [makeTodo("1", "장보기", false, "user-999")] });

    expect(screen.queryByText("홍")).not.toBeInTheDocument();
  });

  it("워크스페이스가 없어도 항목을 렌더링한다", () => {
    renderList({ todos: [makeTodo("1", "장보기", false, "user-1")], currentWorkspace: null });

    expect(screen.getByText("장보기")).toBeInTheDocument();
    expect(screen.queryByText("홍")).not.toBeInTheDocument();
  });
});

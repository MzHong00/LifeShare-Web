import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ROUTES } from "@/constants/routes";
import { getDateWithOffset } from "@/utils/date";
import { useQueryParams } from "@/hooks/useQueryParams";
import { useTodoToggle } from "@/features/todo/hooks/useTodoToggle";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";

import { TodoView } from "./TodoView";

import type { Todo } from "@/features/todo/types/todo";
import type { Workspace } from "@/features/workspace/types/workspace";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQuery: vi.fn(),
}));

vi.mock("@/hooks/useQueryParams", () => ({
  useQueryParams: vi.fn(),
}));

vi.mock("@/features/todo/hooks/useTodoToggle", () => ({
  useTodoToggle: vi.fn(),
}));

vi.mock("@/features/workspace/hooks/useCurrentWorkspace", () => ({
  useCurrentWorkspace: vi.fn(),
}));

vi.mock("@/components/layout/AppHeader", () => ({
  AppHeader: ({ rightElement }: { rightElement?: React.ReactNode }) => (
    <header>{rightElement}</header>
  ),
}));

const mockUseRouter = vi.mocked(useRouter);
const mockUseQuery = vi.mocked(useQuery);
const mockUseQueryParams = vi.mocked(useQueryParams);
const mockUseTodoToggle = vi.mocked(useTodoToggle);
const mockUseCurrentWorkspace = vi.mocked(useCurrentWorkspace);

const today = getDateWithOffset(0);

const todos = [
  {
    id: "todo-1",
    workspaceId: "workspace-1",
    title: "장보기",
    isCompleted: false,
    startDate: today,
    endDate: today,
    createdAt: today,
  },
  {
    id: "todo-2",
    workspaceId: "workspace-1",
    title: "청소",
    isCompleted: true,
    startDate: today,
    endDate: today,
    createdAt: today,
  },
] as unknown as Todo[];

const workspace = { id: "workspace-1", name: "우리집", members: [] } as unknown as Workspace;

describe("TodoView", () => {
  const mockPush = vi.fn();
  const setParamsSet = vi.fn();
  const setParamsDelete = vi.fn();
  const toggleTodo = vi.fn();

  /** useQuery 반환값을 원하는 상태로 세팅한다 */
  const setQueryState = (state: { data?: Todo[]; isPending?: boolean; isError?: boolean }) => {
    mockUseQuery.mockReturnValue({
      data: state.data,
      isPending: state.isPending ?? false,
      isError: state.isError ?? false,
    } as unknown as ReturnType<typeof useQuery>);
  };

  /** 현재 URL 쿼리스트링을 세팅한다 */
  const setSearchParams = (search: string) => {
    mockUseQueryParams.mockReturnValue([
      new URLSearchParams(search),
      { set: setParamsSet, toggle: vi.fn(), delete: setParamsDelete },
    ] as unknown as ReturnType<typeof useQueryParams>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
    mockUseCurrentWorkspace.mockReturnValue({
      currentWorkspace: workspace,
    } as unknown as ReturnType<typeof useCurrentWorkspace>);
    mockUseTodoToggle.mockReturnValue({
      toggleTodo,
      pendingToggleIds: new Set<string>(),
    } as unknown as ReturnType<typeof useTodoToggle>);
    setSearchParams("");
    setQueryState({ data: todos });
  });

  it("로딩 중이면 항목을 렌더링하지 않는다", () => {
    setQueryState({ isPending: true });

    render(<TodoView />);

    expect(screen.queryByText("장보기")).not.toBeInTheDocument();
    expect(screen.queryByText("할 일이 없습니다.")).not.toBeInTheDocument();
  });

  it("조회 실패 시 에러 안내를 렌더링한다", () => {
    setQueryState({ isError: true });

    render(<TodoView />);

    expect(screen.getByText("할 일 목록을 불러오지 못했습니다.")).toBeInTheDocument();
  });

  it("할 일이 없으면 빈 상태 안내를 렌더링한다", () => {
    setQueryState({ data: [] });

    render(<TodoView />);

    expect(screen.getByText("할 일이 없습니다.")).toBeInTheDocument();
  });

  it("조회된 할 일 목록을 렌더링한다", () => {
    render(<TodoView />);

    expect(screen.getByText("장보기")).toBeInTheDocument();
    expect(screen.getByText("청소")).toBeInTheDocument();
  });

  it("filter 쿼리가 없으면 전체 필터를 적용한다", () => {
    render(<TodoView />);

    expect(screen.getByText("장보기")).toBeInTheDocument();
    expect(screen.getByText("청소")).toBeInTheDocument();
  });

  it("filter 쿼리가 completed면 완료 항목만 렌더링한다", () => {
    setSearchParams("filter=completed");

    render(<TodoView />);

    expect(screen.getByText("청소")).toBeInTheDocument();
    expect(screen.queryByText("장보기")).not.toBeInTheDocument();
  });

  it("유효하지 않은 filter 쿼리는 전체 필터로 대체한다", () => {
    setSearchParams("filter=unknown");

    render(<TodoView />);

    expect(screen.getByText("장보기")).toBeInTheDocument();
    expect(screen.getByText("청소")).toBeInTheDocument();
  });

  it("전체가 아닌 필터를 선택하면 filter 쿼리를 설정한다", () => {
    render(<TodoView />);
    fireEvent.click(screen.getByText("진행 중"));

    expect(setParamsSet).toHaveBeenCalledWith("filter", "active");
  });

  it("전체 필터를 선택하면 filter 쿼리를 제거한다", () => {
    setSearchParams("filter=active");

    render(<TodoView />);
    fireEvent.click(screen.getByText("전체"));

    expect(setParamsDelete).toHaveBeenCalledWith("filter");
    expect(setParamsSet).not.toHaveBeenCalled();
  });

  it("추가 버튼을 클릭하면 생성 화면으로 이동한다", () => {
    render(<TodoView />);
    fireEvent.click(screen.getByRole("banner").querySelector("button") as HTMLButtonElement);

    expect(mockPush).toHaveBeenCalledWith(ROUTES.TODO.CREATE.path);
  });

  it("항목의 토글 버튼을 클릭하면 toggleTodo를 호출한다", () => {
    render(<TodoView />);
    fireEvent.click(screen.getByRole("button", { name: "완료 처리" }));

    expect(toggleTodo).toHaveBeenCalledWith("todo-1");
  });
});

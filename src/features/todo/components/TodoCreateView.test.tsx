import { render, screen, fireEvent } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { TODO_COLORS } from "@/constants/theme";
import { getDateWithOffset } from "@/utils/date";
import { useTodoForm } from "@/features/todo/hooks/useTodoForm";

import { TodoCreateView } from "./TodoCreateView";

import type { WorkspaceMember } from "@/features/workspace/types/workspace";

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
}));

vi.mock("@/features/todo/hooks/useTodoForm", () => ({
  useTodoForm: vi.fn(),
}));

vi.mock("@/components/layout/AppHeader", () => ({
  AppHeader: ({ rightElement }: { rightElement?: React.ReactNode }) => (
    <header>{rightElement}</header>
  ),
}));

const mockUseSearchParams = vi.mocked(useSearchParams);
const mockUseTodoForm = vi.mocked(useTodoForm);

const members = [
  { id: "user-1", name: "홍길동", email: "me@test.com", role: "owner" },
] as unknown as WorkspaceMember[];

describe("TodoCreateView", () => {
  const setTitle = vi.fn();
  const setDescription = vi.fn();
  const setAssigneeId = vi.fn();
  const setSelectedColor = vi.fn();
  const handleStartDateChange = vi.fn();
  const handleEndDateChange = vi.fn();
  const handleSave = vi.fn();
  const handleDelete = vi.fn();

  /** useTodoForm 반환값을 원하는 상태로 세팅한다 */
  const setFormState = (
    state: {
      title?: string;
      description?: string;
      assigneeId?: string;
      startDate?: string;
      endDate?: string;
      selectedColor?: string;
      isSaving?: boolean;
    } = {}
  ) => {
    mockUseTodoForm.mockReturnValue({
      title: state.title ?? "",
      setTitle,
      description: state.description ?? "",
      setDescription,
      assigneeId: state.assigneeId,
      setAssigneeId,
      startDate: state.startDate ?? "2026-08-01",
      endDate: state.endDate ?? "2026-08-01",
      handleStartDateChange,
      handleEndDateChange,
      selectedColor: state.selectedColor ?? TODO_COLORS[0],
      setSelectedColor,
      members,
      isSaving: state.isSaving ?? false,
      handleSave,
      handleDelete,
    } as unknown as ReturnType<typeof useTodoForm>);
  };

  /** 현재 URL 쿼리스트링을 세팅한다 */
  const setSearchParams = (search: string) => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams(search) as unknown as ReturnType<typeof useSearchParams>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setSearchParams("");
    setFormState();
  });

  it("생성 모드면 추가하기 버튼과 삭제 버튼 없는 헤더를 렌더링한다", () => {
    render(<TodoCreateView />);

    expect(screen.getByRole("button", { name: "추가하기" })).toBeInTheDocument();
    expect(screen.queryByLabelText("할 일 삭제")).not.toBeInTheDocument();
  });

  it("수정 모드면 저장하기 버튼과 삭제 버튼을 렌더링한다", () => {
    setSearchParams("todoId=todo-1");

    render(<TodoCreateView />);

    expect(screen.getByRole("button", { name: "저장하기" })).toBeInTheDocument();
    expect(screen.getByLabelText("할 일 삭제")).toBeInTheDocument();
  });

  it("쿼리스트링의 todoId와 initialDate를 폼 훅에 전달한다", () => {
    setSearchParams("todoId=todo-1&initialDate=2026-08-10");

    render(<TodoCreateView />);

    expect(mockUseTodoForm).toHaveBeenCalledWith("todo-1", "2026-08-10");
  });

  it("쿼리스트링이 없으면 폼 훅에 null을 전달한다", () => {
    render(<TodoCreateView />);

    expect(mockUseTodoForm).toHaveBeenCalledWith(null, null);
  });

  it("수정 모드의 기존 값을 입력 필드 초기값으로 반영한다", () => {
    setFormState({
      title: "장보기",
      description: "우유 사기",
      startDate: "2026-08-02",
      endDate: "2026-08-05",
    });

    render(<TodoCreateView />);

    expect(screen.getByDisplayValue("장보기")).toBeInTheDocument();
    expect(screen.getByDisplayValue("우유 사기")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-08-02")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-08-05")).toBeInTheDocument();
  });

  it("제목을 입력하면 setTitle을 호출한다", () => {
    render(<TodoCreateView />);
    fireEvent.change(screen.getByPlaceholderText("무엇을 하나요? (예: 데이트, 장보기)"), {
      target: { value: "장보기" },
    });

    expect(setTitle).toHaveBeenCalledWith("장보기");
  });

  it("설명을 입력하면 setDescription을 호출한다", () => {
    render(<TodoCreateView />);
    fireEvent.change(screen.getByPlaceholderText("상세 내용을 입력해주세요."), {
      target: { value: "우유 사기" },
    });

    expect(setDescription).toHaveBeenCalledWith("우유 사기");
  });

  it("시작일을 변경하면 handleStartDateChange를 호출한다", () => {
    const { container } = render(<TodoCreateView />);
    const dateInputs = container.querySelectorAll<HTMLInputElement>("input[type='date']");
    fireEvent.change(dateInputs[0], { target: { value: "2026-08-03" } });

    expect(handleStartDateChange).toHaveBeenCalledWith("2026-08-03");
  });

  it("종료일을 변경하면 handleEndDateChange를 호출한다", () => {
    const { container } = render(<TodoCreateView />);
    const dateInputs = container.querySelectorAll<HTMLInputElement>("input[type='date']");
    fireEvent.change(dateInputs[1], { target: { value: "2026-08-09" } });

    expect(handleEndDateChange).toHaveBeenCalledWith("2026-08-09");
  });

  it("빠른 날짜 버튼을 클릭하면 오프셋 날짜로 종료일을 변경한다", () => {
    render(<TodoCreateView />);
    fireEvent.click(screen.getByRole("button", { name: "내일" }));

    expect(handleEndDateChange).toHaveBeenCalledWith(getDateWithOffset(1));
  });

  it("색상을 선택하면 setSelectedColor를 호출한다", () => {
    render(<TodoCreateView />);
    const colorButtons = screen
      .getAllByRole("button")
      .filter((button) => button.getAttribute("style")?.includes("--color-button-bg"));
    fireEvent.click(colorButtons[1]);

    expect(setSelectedColor).toHaveBeenCalledWith(TODO_COLORS[1]);
  });

  it("담당자를 선택하면 setAssigneeId를 호출한다", () => {
    render(<TodoCreateView />);
    fireEvent.click(screen.getByText("홍길동"));

    expect(setAssigneeId).toHaveBeenCalledWith("user-1");
  });

  it("저장 버튼을 클릭하면 handleSave를 호출한다", () => {
    render(<TodoCreateView />);
    fireEvent.click(screen.getByRole("button", { name: "추가하기" }));

    expect(handleSave).toHaveBeenCalledTimes(1);
  });

  it("저장 중이면 저장 버튼을 비활성화한다", () => {
    setFormState({ title: "장보기", isSaving: true });

    render(<TodoCreateView />);

    expect(screen.getByRole("button", { name: "추가하기" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "추가하기" }));
    expect(handleSave).not.toHaveBeenCalled();
  });

  it("삭제 버튼을 클릭하면 handleDelete를 호출한다", () => {
    setSearchParams("todoId=todo-1");

    render(<TodoCreateView />);
    fireEvent.click(screen.getByLabelText("할 일 삭제"));

    expect(handleDelete).toHaveBeenCalledTimes(1);
  });
});

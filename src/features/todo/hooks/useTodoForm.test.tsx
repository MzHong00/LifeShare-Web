import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { modalActions } from "@/stores/useModalStore";
import { toastActions } from "@/stores/useToastStore";
import { todoQueries } from "@/features/todo/queries/todoQueries";
import {
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
} from "@/features/todo/queries/todoMutations";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { TODO_COLORS } from "@/constants/theme";
import { getTodayDateString } from "@/utils/date";
import { useTodoForm } from "./useTodoForm";

import type { Todo } from "@/features/todo/types/todo";
import type { ReactNode } from "react";

const mockBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: mockBack }),
}));

vi.mock("@/stores/useModalStore", () => ({
  modalActions: { showModal: vi.fn() },
}));

vi.mock("@/stores/useToastStore", () => ({
  toastActions: { showToast: vi.fn() },
}));

vi.mock("@/features/workspace/hooks/useCurrentWorkspace", () => ({
  useCurrentWorkspace: vi.fn(),
}));

vi.mock("@/features/todo/queries/todoQueries", () => ({
  todoQueries: {
    list: vi.fn((workspaceId: string) => ({ queryKey: ["todos", "list", workspaceId] })),
  },
}));

vi.mock("@/features/todo/queries/todoMutations", () => ({
  useCreateTodoMutation: vi.fn(),
  useUpdateTodoMutation: vi.fn(),
  useDeleteTodoMutation: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { Wrapper, queryClient };
};

const createMutation = (mutateAsync = vi.fn(), isPending = false) => ({ mutateAsync, isPending });

describe("useTodoForm", () => {
  const today = getTodayDateString();
  const createMutateAsync = vi.fn();
  const updateMutateAsync = vi.fn();
  const deleteMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCurrentWorkspace).mockReturnValue({
      currentWorkspace: {
        id: "ws-1",
        name: "워크스페이스1",
        type: "couple",
        themeColor: "blue",
        members: [{ id: "member-1", displayName: "민" }],
      },
      workspaces: [],
    } as unknown as ReturnType<typeof useCurrentWorkspace>);
    vi.mocked(useCreateTodoMutation).mockReturnValue(
      createMutation(createMutateAsync) as unknown as ReturnType<typeof useCreateTodoMutation>
    );
    vi.mocked(useUpdateTodoMutation).mockReturnValue(
      createMutation(updateMutateAsync) as unknown as ReturnType<typeof useUpdateTodoMutation>
    );
    vi.mocked(useDeleteTodoMutation).mockReturnValue(
      createMutation(deleteMutateAsync) as unknown as ReturnType<typeof useDeleteTodoMutation>
    );
  });

  it("생성 모드에서는 초기값이 오늘 날짜와 빈 제목으로 설정된다", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTodoForm(null, null), { wrapper: Wrapper });

    expect(result.current.title).toBe("");
    expect(result.current.startDate).toBe(today);
    expect(result.current.endDate).toBe(today);
    expect(result.current.members).toEqual([{ id: "member-1", displayName: "민" }]);
  });

  it("initialDate가 주어지면 시작/종료일 초기값으로 사용한다", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTodoForm(null, "2026-08-01"), { wrapper: Wrapper });

    expect(result.current.startDate).toBe("2026-08-01");
    expect(result.current.endDate).toBe("2026-08-01");
  });

  it("수정 모드에서 할 일 로드가 완료되면 폼 값을 기존 값으로 채운다", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const todos = [
      {
        id: "todo-1",
        title: "기존 제목",
        description: "기존 설명",
        assigneeId: "member-1",
        startDate: "2026-01-01",
        endDate: "2026-01-02",
        color: "#F04452",
        isCompleted: true,
      },
    ];
    queryClient.setQueryData(todoQueries.list("ws-1").queryKey, todos as unknown as Todo[]);

    const { result } = renderHook(() => useTodoForm("todo-1", null), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.title).toBe("기존 제목"));
    expect(result.current.description).toBe("기존 설명");
    expect(result.current.startDate).toBe("2026-01-01");
    expect(result.current.endDate).toBe("2026-01-02");
    expect(result.current.selectedColor).toBe("#F04452");
  });

  it("handleStartDateChange 시 종료일보다 늦으면 종료일도 함께 보정한다", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTodoForm(null, "2026-05-01"), { wrapper: Wrapper });

    act(() => {
      result.current.handleStartDateChange("2026-05-10");
    });

    expect(result.current.startDate).toBe("2026-05-10");
    expect(result.current.endDate).toBe("2026-05-10");
  });

  it("handleEndDateChange 시 시작일보다 이르면 시작일도 함께 보정한다", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTodoForm(null, "2026-05-10"), { wrapper: Wrapper });

    act(() => {
      result.current.handleEndDateChange("2026-05-01");
    });

    expect(result.current.endDate).toBe("2026-05-01");
    expect(result.current.startDate).toBe("2026-05-01");
  });

  it("제목이 비어있으면 handleSave 시 에러 토스트를 띄우고 저장하지 않는다", async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTodoForm(null, null), { wrapper: Wrapper });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(toastActions.showToast).toHaveBeenCalledWith("제목을 입력해주세요.", "error");
    expect(createMutateAsync).not.toHaveBeenCalled();
  });

  it("생성 모드에서 handleSave 성공 시 createTodo를 호출하고 이전 화면으로 돌아간다", async () => {
    createMutateAsync.mockResolvedValueOnce(undefined);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTodoForm(null, "2026-05-01"), { wrapper: Wrapper });

    act(() => {
      result.current.setTitle("새 할 일");
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(createMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "ws-1",
        title: "새 할 일",
        isCompleted: false,
        startDate: "2026-05-01",
        endDate: "2026-05-01",
      })
    );
    expect(mockBack).toHaveBeenCalled();
  });

  it("수정 모드에서 handleSave 성공 시 updateTodo를 호출하고 성공 토스트를 띄운다", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const todos = [
      {
        id: "todo-1",
        title: "기존 제목",
        description: "",
        assigneeId: undefined,
        startDate: "2026-01-01",
        endDate: "2026-01-02",
        color: "#F04452",
        isCompleted: false,
      },
    ];
    queryClient.setQueryData(todoQueries.list("ws-1").queryKey, todos as unknown as Todo[]);
    updateMutateAsync.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useTodoForm("todo-1", null), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.title).toBe("기존 제목"));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(updateMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "todo-1",
        updates: expect.objectContaining({ title: "기존 제목" }),
      })
    );
    expect(toastActions.showToast).toHaveBeenCalledWith("항목이 수정되었습니다.", "success");
    expect(mockBack).toHaveBeenCalled();
  });

  it("handleSave 실패 시 에러 토스트를 띄운다", async () => {
    createMutateAsync.mockRejectedValueOnce(new Error("fail"));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTodoForm(null, null), { wrapper: Wrapper });

    act(() => {
      result.current.setTitle("새 할 일");
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(toastActions.showToast).toHaveBeenCalledWith(
      "저장에 실패했습니다. 다시 시도해주세요.",
      "error"
    );
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("존재하지 않는 todoId로 수정 시도 시 에러 토스트를 띄우고 저장하지 않는다", async () => {
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(todoQueries.list("ws-1").queryKey, [] as unknown as Todo[]);

    const { result } = renderHook(() => useTodoForm("missing-todo", null), { wrapper: Wrapper });

    act(() => {
      result.current.setTitle("제목");
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(toastActions.showToast).toHaveBeenCalledWith("항목을 찾을 수 없습니다.", "error");
    expect(updateMutateAsync).not.toHaveBeenCalled();
  });

  it("handleDelete 호출 시 확인 모달을 띄우고 확인하면 deleteTodo를 호출한다", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const todos = [
      {
        id: "todo-1",
        title: "기존 제목",
        description: "",
        startDate: "2026-01-01",
        endDate: "2026-01-02",
        color: "#F04452",
        isCompleted: false,
      },
    ];
    queryClient.setQueryData(todoQueries.list("ws-1").queryKey, todos as unknown as Todo[]);
    deleteMutateAsync.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useTodoForm("todo-1", null), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.title).toBe("기존 제목"));

    act(() => {
      result.current.handleDelete();
    });

    expect(modalActions.showModal).toHaveBeenCalledWith(
      expect.objectContaining({ type: "confirm", title: "삭제" })
    );

    const config = vi.mocked(modalActions.showModal).mock.calls[0][0] as unknown as {
      onConfirm: () => Promise<void>;
    };
    await act(async () => {
      await config.onConfirm();
    });

    expect(deleteMutateAsync).toHaveBeenCalledWith("todo-1");
    expect(mockBack).toHaveBeenCalled();
  });

  it("handleDelete에서 삭제 실패 시 에러 토스트를 띄운다", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const todos = [
      {
        id: "todo-1",
        title: "기존 제목",
        description: "",
        startDate: "2026-01-01",
        endDate: "2026-01-02",
        color: "#F04452",
        isCompleted: false,
      },
    ];
    queryClient.setQueryData(todoQueries.list("ws-1").queryKey, todos as unknown as Todo[]);
    deleteMutateAsync.mockRejectedValueOnce(new Error("fail"));

    const { result } = renderHook(() => useTodoForm("todo-1", null), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.title).toBe("기존 제목"));

    act(() => {
      result.current.handleDelete();
    });

    const config = vi.mocked(modalActions.showModal).mock.calls[0][0] as unknown as {
      onConfirm: () => Promise<void>;
    };
    await act(async () => {
      await config.onConfirm();
    });

    expect(toastActions.showToast).toHaveBeenCalledWith(
      "삭제에 실패했습니다. 다시 시도해주세요.",
      "error"
    );
  });

  it("초기 렌더 이후 할 일이 뒤늦게 로드되면 폼 값을 기존 값으로 다시 채운다", async () => {
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(todoQueries.list("ws-1").queryKey, [] as unknown as Todo[]);

    const { result } = renderHook(() => useTodoForm("todo-1", "2026-03-01"), { wrapper: Wrapper });
    expect(result.current.title).toBe("");
    expect(result.current.startDate).toBe("2026-03-01");

    act(() => {
      queryClient.setQueryData(todoQueries.list("ws-1").queryKey, [
        {
          id: "todo-1",
          title: "나중에 온 제목",
          description: "나중에 온 설명",
          assigneeId: "member-1",
          startDate: "2026-06-01",
          endDate: "2026-06-02",
          color: "#F04452",
          isCompleted: false,
        },
      ] as unknown as Todo[]);
    });

    await waitFor(() => expect(result.current.title).toBe("나중에 온 제목"));
    expect(result.current.description).toBe("나중에 온 설명");
    expect(result.current.assigneeId).toBe("member-1");
    expect(result.current.startDate).toBe("2026-06-01");
    expect(result.current.endDate).toBe("2026-06-02");
    expect(result.current.selectedColor).toBe("#F04452");
  });

  it("뒤늦게 로드된 할 일에 제목·설명·색상이 없으면 기본값으로 채운다", async () => {
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(todoQueries.list("ws-1").queryKey, [] as unknown as Todo[]);

    const { result } = renderHook(() => useTodoForm("todo-1", null), { wrapper: Wrapper });

    act(() => {
      queryClient.setQueryData(todoQueries.list("ws-1").queryKey, [
        {
          id: "todo-1",
          title: "",
          description: "",
          assigneeId: undefined,
          startDate: "2026-06-01",
          endDate: "2026-06-02",
          color: "",
          isCompleted: false,
        },
      ] as unknown as Todo[]);
    });

    await waitFor(() => expect(result.current.startDate).toBe("2026-06-01"));
    expect(result.current.title).toBe("");
    expect(result.current.description).toBe("");
    expect(result.current.assigneeId).toBeUndefined();
    expect(result.current.selectedColor).toBe(TODO_COLORS[0]);
  });

  it("존재하지 않는 todoId로 삭제 시도 시 모달 없이 에러 토스트를 띄운다", async () => {
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(todoQueries.list("ws-1").queryKey, [] as unknown as Todo[]);

    const { result } = renderHook(() => useTodoForm("missing-todo", null), { wrapper: Wrapper });

    act(() => {
      result.current.handleDelete();
    });

    expect(toastActions.showToast).toHaveBeenCalledWith("항목을 찾을 수 없습니다.", "error");
    expect(modalActions.showModal).not.toHaveBeenCalled();
  });

  it("생성 모드에서 handleDelete를 호출하면 아무 동작도 하지 않는다", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTodoForm(null, null), { wrapper: Wrapper });

    act(() => {
      result.current.handleDelete();
    });

    expect(modalActions.showModal).not.toHaveBeenCalled();
    expect(toastActions.showToast).not.toHaveBeenCalled();
  });

  it("워크스페이스가 없으면 members는 빈 배열이고 handleSave는 저장하지 않는다", async () => {
    vi.mocked(useCurrentWorkspace).mockReturnValue({
      currentWorkspace: undefined,
      workspaces: [],
    } as unknown as ReturnType<typeof useCurrentWorkspace>);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTodoForm(null, null), { wrapper: Wrapper });

    expect(result.current.members).toEqual([]);

    act(() => {
      result.current.setTitle("새 할 일");
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(createMutateAsync).not.toHaveBeenCalled();
    expect(toastActions.showToast).not.toHaveBeenCalled();
  });

  it("저장이 진행 중이면 handleSave 호출을 무시한다", async () => {
    vi.mocked(useCreateTodoMutation).mockReturnValue(
      createMutation(createMutateAsync, true) as unknown as ReturnType<typeof useCreateTodoMutation>
    );
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTodoForm(null, null), { wrapper: Wrapper });

    expect(result.current.isSaving).toBe(true);

    await act(async () => {
      await result.current.handleSave();
    });

    expect(createMutateAsync).not.toHaveBeenCalled();
    expect(toastActions.showToast).not.toHaveBeenCalled();
  });
});

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { todosApi } from "@/features/todo/api/todos";
import { toastActions } from "@/stores/useToastStore";
import { todoQueries } from "./todoQueries";

import type { Todo } from "@/features/todo/types/todo";

const TOGGLE_TODO_ERROR_MESSAGE = "완료 상태 변경에 실패했습니다."; // 토글 뮤테이션 실패 시 토스트 메시지

/** 워크스페이스의 할 일 목록 쿼리를 무효화해 최신 목록을 다시 받아오는 콜백을 반환한다 */
const useInvalidateTodoList = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: todoQueries.list(workspaceId).queryKey });
};

export const useCreateTodoMutation = (workspaceId: string) =>
  useMutation({
    mutationFn: (todo: Omit<Todo, "id" | "createdAt">) => todosApi.create(todo),
    onSuccess: useInvalidateTodoList(workspaceId),
  });

export const useUpdateTodoMutation = (workspaceId: string) =>
  useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<Todo, "id" | "workspaceId" | "createdAt">>;
    }) => todosApi.update(id, updates),
    onSuccess: useInvalidateTodoList(workspaceId),
  });

export const useToggleTodoMutation = (workspaceId: string) =>
  useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      todosApi.toggle(id, isCompleted),
    onSuccess: useInvalidateTodoList(workspaceId),
    onError: () => toastActions.showToast(TOGGLE_TODO_ERROR_MESSAGE, "error"),
  });

export const useDeleteTodoMutation = (workspaceId: string) =>
  useMutation({
    mutationFn: (id: string) => todosApi.delete(id),
    onSuccess: useInvalidateTodoList(workspaceId),
  });

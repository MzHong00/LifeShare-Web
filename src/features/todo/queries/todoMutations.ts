import { useMutation, useQueryClient } from "@tanstack/react-query";

import { todosApi } from "@/features/todo/api/todos";
import { toastActions } from "@/stores/useToastStore";
import { todoQueries } from "./todoQueries";

import type { Todo } from "@/features/todo/types/todo";

const TOGGLE_TODO_ERROR_MESSAGE = "완료 상태 변경에 실패했습니다."; // 토글 뮤테이션 실패 시 토스트 메시지

export const useCreateTodoMutation = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (todo: Omit<Todo, "id" | "createdAt">) => todosApi.create(todo),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: todoQueries.list(workspaceId).queryKey }),
  });
};

export const useUpdateTodoMutation = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<Todo, "id" | "workspaceId" | "createdAt">>;
    }) => todosApi.update(id, updates),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: todoQueries.list(workspaceId).queryKey }),
  });
};

export const useToggleTodoMutation = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      todosApi.toggle(id, isCompleted),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: todoQueries.list(workspaceId).queryKey }),
    onError: () => toastActions.showToast(TOGGLE_TODO_ERROR_MESSAGE, "error"),
  });
};

export const useDeleteTodoMutation = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => todosApi.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: todoQueries.list(workspaceId).queryKey }),
  });
};

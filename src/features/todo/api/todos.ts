import { bffFetch } from "@/lib/api/bffClient";

import type { Todo } from "@/features/todo/types/todo";

export const todosApi = {
  list: async (workspaceId: string): Promise<Todo[]> =>
    bffFetch<Todo[]>(
      `/api/todos?workspaceId=${encodeURIComponent(workspaceId)}`,
      "할 일 목록 조회에 실패했습니다."
    ),

  create: async (todo: Omit<Todo, "id" | "createdAt">): Promise<Todo> =>
    bffFetch<Todo>("/api/todos", "할 일 생성에 실패했습니다.", {
      method: "POST",
      body: JSON.stringify(todo),
    }),

  update: async (
    id: string,
    updates: Partial<Omit<Todo, "id" | "workspaceId" | "createdAt">>
  ): Promise<Todo> =>
    bffFetch<Todo>(`/api/todos/${encodeURIComponent(id)}`, "할 일 수정에 실패했습니다.", {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),

  toggle: async (id: string, isCompleted: boolean): Promise<Todo> =>
    bffFetch<Todo>(`/api/todos/${encodeURIComponent(id)}`, "할 일 상태 변경에 실패했습니다.", {
      method: "PATCH",
      body: JSON.stringify({ isCompleted }),
    }),

  delete: async (id: string): Promise<void> =>
    bffFetch<void>(`/api/todos/${encodeURIComponent(id)}`, "할 일 삭제에 실패했습니다.", {
      method: "DELETE",
    }),
};

import { afterEach, describe, expect, it, vi } from "vitest";

import { todosApi } from "@/features/todo/api/todos";

import { mockFetch } from "@/lib/api/mockFetch";

import type { Todo } from "@/features/todo/types/todo";

const todo: Todo = {
  id: "todo-1",
  workspaceId: "workspace-1",
  title: "제목",
  description: "설명",
  isCompleted: false,
  assigneeId: "user-1",
  startDate: "2026-07-01",
  endDate: "2026-07-02",
  color: "#fff",
  createdAt: "2026-07-01T00:00:00Z",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("todosApi.list", () => {
  it("workspaceId 쿼리로 GET /api/todos를 호출하고 Todo 목록을 반환한다", async () => {
    const fetchSpy = mockFetch(200, [todo]);

    const result = await todosApi.list("workspace-1");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/todos?workspaceId=workspace-1",
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    );
    expect(result).toEqual([todo]);
  });

  it("조회 실패 시 서버 메시지로 에러를 throw한다", async () => {
    mockFetch(500, { message: "할 일 목록 조회에 실패했습니다." });

    await expect(todosApi.list("workspace-1")).rejects.toThrow("할 일 목록 조회에 실패했습니다.");
  });
});

describe("todosApi.create", () => {
  it("POST /api/todos로 생성 요청을 보내고 생성된 Todo를 반환한다", async () => {
    const fetchSpy = mockFetch(201, todo);
    const { id: _id, createdAt: _createdAt, ...createInput } = todo;

    const result = await todosApi.create(createInput);

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/todos",
      expect.objectContaining({ method: "POST", body: JSON.stringify(createInput) })
    );
    expect(result).toEqual(todo);
  });

  it("생성 실패 시 에러를 throw한다", async () => {
    mockFetch(500, { message: "할 일 생성에 실패했습니다." });
    const { id: _id, createdAt: _createdAt, ...createInput } = todo;

    await expect(todosApi.create(createInput)).rejects.toThrow("할 일 생성에 실패했습니다.");
  });
});

describe("todosApi.update", () => {
  it("PATCH /api/todos/[id]로 변경 필드를 보내고 수정된 Todo를 반환한다", async () => {
    const fetchSpy = mockFetch(200, { ...todo, title: "수정된 제목" });

    const result = await todosApi.update("todo-1", { title: "수정된 제목" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/todos/todo-1",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ title: "수정된 제목" }) })
    );
    expect(result.title).toBe("수정된 제목");
  });

  it("수정 실패 시 에러를 throw한다", async () => {
    mockFetch(500, { message: "할 일 수정에 실패했습니다." });

    await expect(todosApi.update("todo-1", { title: "수정된 제목" })).rejects.toThrow(
      "할 일 수정에 실패했습니다."
    );
  });
});

describe("todosApi.toggle", () => {
  it("PATCH /api/todos/[id]로 isCompleted만 보내고 변경된 Todo를 반환한다", async () => {
    const fetchSpy = mockFetch(200, { ...todo, isCompleted: true });

    const result = await todosApi.toggle("todo-1", true);

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/todos/todo-1",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ isCompleted: true }) })
    );
    expect(result.isCompleted).toBe(true);
  });

  it("토글 실패 시 에러를 throw한다", async () => {
    mockFetch(500, { message: "할 일 상태 변경에 실패했습니다." });

    await expect(todosApi.toggle("todo-1", true)).rejects.toThrow(
      "할 일 상태 변경에 실패했습니다."
    );
  });
});

describe("todosApi.delete", () => {
  it("DELETE /api/todos/[id]로 삭제 요청을 보낸다", async () => {
    const fetchSpy = mockFetch(204, null);

    await todosApi.delete("todo-1");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/todos/todo-1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("삭제 실패 시 에러를 throw한다", async () => {
    mockFetch(500, { message: "할 일 삭제에 실패했습니다." });

    await expect(todosApi.delete("todo-1")).rejects.toThrow("할 일 삭제에 실패했습니다.");
  });
});

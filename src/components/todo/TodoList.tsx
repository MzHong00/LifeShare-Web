"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { todoActions } from "@/stores/useTodoStore";
import type { Todo, Workspace } from "@/types";
import { TodoItem } from "@/components/todo/TodoItem";
import styles from "./TodoList.module.scss";

type Filter = "all" | "active" | "completed";

const FILTER_LABELS: Record<Filter, string> = {
  all: "전체",
  active: "진행 중",
  completed: "완료",
};

interface TodoListProps {
  todos: Todo[];
  currentWorkspace: Workspace | null;
  // 캘린더처럼 특정 날짜 기준으로 추가할 때 initialDate를 넘길 수 있음
  initialDate?: string;
}

export const TodoList = ({ todos, currentWorkspace, initialDate }: TodoListProps) => {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");

  const activeTodos = todos.filter((t) => !t.isCompleted);
  const completedTodos = todos.filter((t) => t.isCompleted);
  const displayedTodos =
    filter === "all" ? todos : filter === "active" ? activeTodos : completedTodos;

  const addHref = initialDate ? `/todo/create?initialDate=${initialDate}` : "/todo/create";

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        {(["all", "active", "completed"] as const).map((f) => (
          <button
            key={f}
            className={[styles.filterButton, filter === f ? styles.filterActive : ""].join(" ")}
            onClick={() => setFilter(f)}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {displayedTodos.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>
              {filter === "completed" ? "완료된 할 일이 없습니다." : "할 일이 없습니다."}
            </p>
            {filter !== "completed" && (
              <button onClick={() => router.push(addHref)} className={styles.emptyAction}>
                할 일 추가하기
              </button>
            )}
          </div>
        ) : (
          displayedTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              item={todo}
              currentWorkspace={currentWorkspace}
              onToggle={todoActions.toggleTodo}
              onPress={(id) => router.push(`/todo/create?todoId=${id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
};

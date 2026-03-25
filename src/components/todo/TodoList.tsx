"use client";
import { useRouter } from "next/navigation";
import { todoActions } from "@/stores/useTodoStore";
import type { Todo, Workspace } from "@/types";
import { TodoItem } from "@/components/todo/TodoItem";
import styles from "./TodoList.module.scss";

// 할 일 목록 필터 타입. 페이지에서 URL 쿼리스트링으로 관리한다.
export type Filter = "all" | "active" | "completed";

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
  // 현재 활성 필터. 부모(페이지)에서 URL 쿼리스트링과 동기화해 관리한다.
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
}

export const TodoList = ({ todos, currentWorkspace, initialDate, filter, onFilterChange }: TodoListProps) => {
  const router = useRouter();

  const activeTodos = todos.filter((t) => !t.isCompleted);
  const completedTodos = todos.filter((t) => t.isCompleted);
  // 선택된 필터에 따라 표시할 목록을 결정한다.
  const displayedTodos =
    filter === "all" ? todos : filter === "active" ? activeTodos : completedTodos;

  // initialDate가 있으면 해당 날짜를 기본값으로 세팅한 채로 생성 화면으로 이동한다.
  const addHref = initialDate ? `/todo/create?initialDate=${initialDate}` : "/todo/create";

  return (
    <div className={styles.container}>
      {/* 필터 탭: 전체 / 진행 중 / 완료 */}
      <div className={styles.filters}>
        {(["all", "active", "completed"] as const).map((f) => (
          <button
            key={f}
            className={[styles.filterButton, filter === f ? styles.filterActive : ""].join(" ")}
            onClick={() => onFilterChange(f)}
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
            {/* 완료 필터일 때는 추가 버튼을 숨긴다 */}
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

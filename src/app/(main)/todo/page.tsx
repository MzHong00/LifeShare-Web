"use client";
import { useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useTodoStore } from "@/stores/useTodoStore";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { useQueryParams } from "@/hooks/useQueryParams";
import { AppHeader } from "@/components/common/AppHeader";
import { TodoList } from "@/components/todo/TodoList";
import type { Filter } from "@/components/todo/TodoList";
import styles from "./todo.module.scss";

// URL에 허용되는 filter 값 목록. 외부 입력 검증에 사용한다.
const VALID_FILTERS: Filter[] = ["all", "active", "completed"];

// useSearchParams를 사용하므로 Suspense 경계 안에서 렌더링해야 한다.
const TodoContent = () => {
  const router = useRouter();
  const [params, setParams] = useQueryParams();
  const todos = useTodoStore((s) => s.todos);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  // URL의 ?filter= 값을 읽어 현재 필터를 결정한다.
  // 유효하지 않은 값이 들어오면 기본값 "all"로 폴백한다.
  const rawFilter = params.get("filter");
  const filter: Filter = VALID_FILTERS.includes(rawFilter as Filter) ? (rawFilter as Filter) : "all";

  // 현재 워크스페이스에 속한 할 일만 표시한다.
  const workspaceTodos = useMemo(
    () => todos.filter((t) => t.workspaceId === currentWorkspace?.id),
    [todos, currentWorkspace?.id]
  );

  // 필터 변경 시 URL을 업데이트한다.
  // "all"은 기본값이므로 파라미터를 제거해 URL을 깔끔하게 유지한다.
  const handleFilterChange = (f: Filter) => {
    if (f === "all") {
      setParams.delete("filter");
    } else {
      setParams.set("filter", f);
    }
  };

  return (
    <div className={styles.page}>
      <AppHeader
        rightElement={
          <button onClick={() => router.push("/todo/create")} className={styles.addButton}>
            <Plus size={22} />
          </button>
        }
      />
      <TodoList
        todos={workspaceTodos}
        currentWorkspace={currentWorkspace}
        filter={filter}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
}

const TodoPage = () => {
  // useSearchParams 사용 시 Next.js App Router에서 Suspense 래핑이 필요하다.
  return (
    <Suspense>
      <TodoContent />
    </Suspense>
  );
};

export default TodoPage;

"use client";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { ROUTES } from "@/constants/routes";
import { todoQueries } from "@/features/todo/queries/todoQueries";
import { useTodoToggle } from "@/features/todo/hooks/useTodoToggle";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { useQueryParams } from "@/hooks/useQueryParams";
import { AppHeader } from "@/components/layout/AppHeader";
import { TodoList } from "@/features/todo/components/TodoList";
import { FILTERS } from "@/features/todo/hooks/useFilteredTodos";

import styles from "./TodoView.module.scss";

import type { Filter } from "@/features/todo/hooks/useFilteredTodos";

export const TodoView = () => {
  const router = useRouter();
  const [params, setParams] = useQueryParams();
  const { currentWorkspace } = useCurrentWorkspace();
  const {
    data: todos = [],
    isPending,
    isError,
  } = useQuery(todoQueries.list(currentWorkspace?.id ?? ""));
  const { toggleTodo: handleToggle } = useTodoToggle(currentWorkspace?.id ?? "", todos);

  const rawFilter = params.get("filter");
  const filter: Filter = FILTERS.includes(rawFilter as Filter) ? (rawFilter as Filter) : "all";

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
          <button onClick={() => router.push(ROUTES.TODO.CREATE.path)} className={styles.addButton}>
            <Plus size={22} />
          </button>
        }
      />
      <TodoList
        todos={todos}
        currentWorkspace={currentWorkspace}
        filter={filter}
        isPending={isPending}
        isError={isError}
        onFilterChange={handleFilterChange}
        onToggle={handleToggle}
      />
    </div>
  );
};

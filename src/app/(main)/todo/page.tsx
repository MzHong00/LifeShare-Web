"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useTodoStore } from "@/stores/useTodoStore";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { AppHeader } from "@/components/common/AppHeader";
import { TodoList } from "@/components/todo/TodoList";
import styles from "./todo.module.scss";

export default function TodoPage() {
  const router = useRouter();
  const todos = useTodoStore((s) => s.todos);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  const workspaceTodos = useMemo(
    () => todos.filter((t) => t.workspaceId === currentWorkspace?.id),
    [todos, currentWorkspace?.id]
  );

  return (
    <div className={styles.page}>
      <AppHeader
        title="할 일"
        rightElement={
          <button onClick={() => router.push("/todo/create")} className={styles.addButton}>
            <Plus size={22} />
          </button>
        }
      />
      <TodoList todos={workspaceTodos} currentWorkspace={currentWorkspace} />
    </div>
  );
}

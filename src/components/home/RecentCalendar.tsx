"use client";
import { useRouter } from "next/navigation";
import { Calendar, CheckCircle2, ChevronRight } from "lucide-react";
import { useCalendarStore } from "@/stores/useCalendarStore";
import { useTodoStore, todoActions } from "@/stores/useTodoStore";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { getTodayDateString } from "@/utils/date";
import { Card } from "@/components/common/Card";
import { COLORS } from "@/constants/theme";
import styles from "./RecentCalendar.module.scss";

export const RecentCalendar = () => {
  const router = useRouter();
  const today = getTodayDateString();
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const events = useCalendarStore((s) => s.events);
  const todos = useTodoStore((s) => s.todos);

  const todayEvents = events
    .filter(
      (e) =>
        e.workspaceId === currentWorkspace?.id &&
        today >= e.startDate &&
        today <= e.endDate
    )
    .slice(0, 2);

  const todayTodos = todos
    .filter(
      (t) =>
        t.workspaceId === currentWorkspace?.id &&
        today >= t.startDate &&
        today <= t.endDate
    )
    .slice(0, 3);

  const hasData = todayEvents.length > 0 || todayTodos.length > 0;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>오늘의 일정</h2>
        <button onClick={() => router.push("/calendar")} className={styles.viewAllButton}>
          <span>전체보기</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {!hasData ? (
        <button onClick={() => router.push("/calendar")} className={styles.emptyButton}>
          <Calendar size={24} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>오늘은 예정된 일정이 없어요.</p>
          <p className={styles.emptyDesc}>새로운 일정을 추가해보세요</p>
        </button>
      ) : (
        <div className={styles.list}>
          {todayEvents.map((event) => (
            <button key={event.id} onClick={() => router.push("/calendar")} style={{ width: "100%" }}>
              <Card className={styles.eventCard}>
                <div
                  className={styles.eventBar}
                  style={{ backgroundColor: event.color || COLORS.primary }}
                />
                <div className={styles.eventInfo}>
                  <p className={styles.eventTitle}>{event.title}</p>
                  <p className={styles.eventSub}>종일</p>
                </div>
              </Card>
            </button>
          ))}

          {todayTodos.map((todo) => (
            <Card key={todo.id} className={styles.todoCard}>
              <button onClick={() => todoActions.toggleTodo(todo.id)} className={styles.todoToggle}>
                {todo.isCompleted ? (
                  <CheckCircle2
                    size={24}
                    color={todo.color || COLORS.primary}
                    fill={(todo.color || COLORS.primary) + "20"}
                  />
                ) : (
                  <div
                    className={styles.todoCircle}
                    style={{ borderColor: todo.color || COLORS.border }}
                  />
                )}
              </button>
              <button
                onClick={() => router.push(`/todo/create?todoId=${todo.id}`)}
                className={styles.todoTitleButton}
              >
                <p className={[styles.todoTitle, todo.isCompleted && styles.todoTitleDone].filter(Boolean).join(' ')}>
                  {todo.title}
                </p>
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

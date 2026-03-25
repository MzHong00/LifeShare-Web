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

// 홈 화면에 오늘의 이벤트·할 일을 요약해서 보여주는 컴포넌트
export const RecentCalendar = () => {
  const router = useRouter();
  const today = getTodayDateString();
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const events = useCalendarStore((s) => s.events);
  const todos = useTodoStore((s) => s.todos);

  // 오늘 날짜가 범위에 포함되는 이벤트만 가져온다. 최대 2개까지 표시한다.
  const todayEvents = events
    .filter(
      (e) =>
        e.workspaceId === currentWorkspace?.id &&
        today >= e.startDate &&
        today <= e.endDate
    )
    .slice(0, 2);

  // 오늘 날짜가 범위에 포함되는 할 일만 가져온다. 최대 3개까지 표시한다.
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
        {/* ?date=오늘 을 넘겨 캘린더 페이지에서 오늘 날짜가 선택된 채로 열리게 한다 */}
        <button onClick={() => router.push(`/calendar?date=${today}`)} className={styles.viewAllButton}>
          <span>전체보기</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {!hasData ? (
        <button onClick={() => router.push(`/calendar?date=${today}`)} className={styles.emptyButton}>
          <Calendar size={24} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>오늘은 예정된 일정이 없어요.</p>
          <p className={styles.emptyDesc}>새로운 일정을 추가해보세요</p>
        </button>
      ) : (
        <div className={styles.list}>
          {todayEvents.map((event) => (
            // 이벤트 클릭 시 캘린더의 오늘 날짜로 이동한다.
            <button key={event.id} onClick={() => router.push(`/calendar?date=${today}`)} style={{ width: "100%" }}>
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
              {/* 체크 버튼: 완료 여부를 토글한다 */}
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
              {/* 제목 버튼: 할 일 수정 화면으로 이동한다 */}
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

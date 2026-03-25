"use client";
import { useState, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendarStore } from "@/stores/useCalendarStore";
import { useTodoStore } from "@/stores/useTodoStore";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { useQueryParams } from "@/hooks/useQueryParams";
import { getTodayDateString, formatDate, getIntermediateDates } from "@/utils/date";
import { TodoList } from "@/components/todo/TodoList";
import type { Filter } from "@/components/todo/TodoList";
import { Card } from "@/components/common/Card";
import { AppHeader } from "@/components/common/AppHeader";
import { COLORS } from "@/constants/theme";
import dayjs from "dayjs";
import styles from "./calendar.module.scss";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// useSearchParams를 사용하므로 Suspense 경계 안에서 렌더링해야 한다.
function CalendarContent() {
  const router = useRouter();
  const [params, setParams] = useQueryParams();
  const today = getTodayDateString();

  // ?date= 파라미터로 초기 선택 날짜를 결정한다. 없으면 오늘로 폴백한다.
  // 외부에서 /calendar?date=2026-03-25 형식으로 딥링크가 가능하다.
  const dateParam = params.get("date") || today;
  const [selectedDate, setSelectedDate] = useState(dateParam);
  // currentMonth는 달력 그리드 표시용으로만 쓰이며 URL에 동기화하지 않는다.
  const [currentMonth, setCurrentMonth] = useState(dayjs(dateParam));
  // 할 일 필터는 날짜가 바뀔 때마다 초기화되므로 로컬 상태로 관리한다.
  const [filter, setFilter] = useState<Filter>("all");

  const events = useCalendarStore((s) => s.events);
  const todos = useTodoStore((s) => s.todos);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  // 이벤트·할 일이 존재하는 날짜에 표시할 색상 점(dot) 목록을 계산한다.
  // 날짜 범위를 가진 항목은 중간 날짜까지 모두 마킹한다.
  const markedDates = useMemo(() => {
    const marks: Record<string, string[]> = {};
    const addMark = (items: Array<{ startDate: string; endDate: string; color: string }>) => {
      items.forEach((item) => {
        const range = [item.startDate, ...getIntermediateDates(item.startDate, item.endDate), item.endDate];
        // 중복 날짜 제거 후 색상 목록에 추가한다.
        [...new Set(range)].forEach((date) => {
          if (!marks[date]) marks[date] = [];
          if (!marks[date].includes(item.color)) marks[date].push(item.color);
        });
      });
    };
    addMark(events.map((e) => ({ ...e })));
    addMark(todos.map((t) => ({ startDate: t.startDate, endDate: t.endDate, color: t.color || COLORS.primary })));
    return marks;
  }, [events, todos]);

  // 현재 월의 달력 셀 배열을 생성한다.
  // 월 시작 요일 앞을 null로 채워 그리드 정렬을 맞춘다.
  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth.startOf("month");
    const daysInMonth = currentMonth.daysInMonth();
    const startDay = startOfMonth.day();
    const days: (string | null)[] = Array(startDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(currentMonth.date(i).format("YYYY-MM-DD"));
    }
    return days;
  }, [currentMonth]);

  // 선택된 날짜에 해당하는 할 일만 필터링한다.
  // 날짜 범위 기반 할 일은 startDate ~ endDate 사이에 포함되는지 확인한다.
  const selectedDateTodos = useMemo(() => {
    return todos.filter(
      (t) =>
        t.workspaceId === currentWorkspace?.id &&
        selectedDate >= t.startDate &&
        selectedDate <= t.endDate
    );
  }, [todos, currentWorkspace?.id, selectedDate]);

  // 날짜 선택 시 URL을 업데이트하고 할 일 필터를 초기화한다.
  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setFilter("all");
    setParams.set("date", date);
  };

  return (
    <div className={styles.page}>
      <AppHeader title="캘린더" />

      <div className={styles.calendarHeader}>
        <h2 className={styles.monthTitle}>{currentMonth.format("YYYY년 M월")}</h2>
        <div className={styles.controls}>
          <button
            onClick={() => setCurrentMonth((m) => m.subtract(1, "month"))}
            className={styles.controlButton}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCurrentMonth((m) => m.add(1, "month"))}
            className={styles.controlButton}
          >
            <ChevronRight size={18} />
          </button>
          {/* 선택된 날짜를 initialDate로 넘겨 할 일 생성 시 날짜를 자동 세팅한다 */}
          <button
            onClick={() => router.push(`/todo/create?initialDate=${selectedDate}`)}
            className={styles.controlButton}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <Card className={styles.calendarCard}>
        {/* 요일 헤더 */}
        <div className={styles.weekdays}>
          {WEEKDAYS.map((day, i) => (
            <div
              key={day}
              className={[
                styles.weekday,
                i === 0 ? styles.weekdaySun : i === 6 ? styles.weekdaySat : styles.weekdayDefault
              ].filter(Boolean).join(' ')}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className={styles.days}>
          {calendarDays.map((date, idx) => {
            // null은 월 시작 전 빈 셀이다.
            if (!date) return <div key={`empty-${idx}`} />;
            const dayOfWeek = dayjs(date).day();
            const isSelected = date === selectedDate;
            const isToday = date === today;
            const dots = markedDates[date] || [];

            return (
              <button key={date} onClick={() => handleSelectDate(date)} className={styles.dayButton}>
                <span
                  className={[
                    styles.dayNumber,
                    isSelected
                      ? styles.dayNumberSelected
                      : isToday
                      ? styles.dayNumberToday
                      : dayOfWeek === 0
                      ? styles.dayNumberSun
                      : dayOfWeek === 6
                      ? styles.dayNumberSat
                      : undefined
                  ].filter(Boolean).join(' ')}
                >
                  {dayjs(date).date()}
                </span>
                {/* 이벤트·할 일 존재 표시 점 (최대 3개) */}
                {dots.length > 0 && (
                  <div className={styles.dots}>
                    {dots.slice(0, 3).map((color, i) => (
                      <div
                        key={i}
                        className={styles.dot}
                        // 선택된 날짜는 배경이 어두우므로 점을 흰색으로 표시한다.
                        style={{ backgroundColor: isSelected ? "white" : color }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* 선택된 날짜의 할 일 목록 */}
      <div className={styles.todoSection}>
        <h2 className={styles.todoTitle}>{formatDate(selectedDate, "M월 D일")} 할 일</h2>
        <TodoList
          todos={selectedDateTodos}
          currentWorkspace={currentWorkspace}
          initialDate={selectedDate}
          filter={filter}
          onFilterChange={setFilter}
        />
      </div>
    </div>
  );
}

export default function CalendarPage() {
  // useSearchParams 사용 시 Next.js App Router에서 Suspense 래핑이 필요하다.
  return (
    <Suspense>
      <CalendarContent />
    </Suspense>
  );
}

"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendarStore } from "@/stores/useCalendarStore";
import { useTodoStore } from "@/stores/useTodoStore";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { getTodayDateString, formatDate, getIntermediateDates } from "@/utils/date";
import { TodoList } from "@/components/todo/TodoList";
import { Card } from "@/components/common/Card";
import { AppHeader } from "@/components/common/AppHeader";
import { COLORS } from "@/constants/theme";
import dayjs from "dayjs";
import styles from "./calendar.module.scss";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function CalendarPage() {
  const router = useRouter();
  const today = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(dayjs(today));

  const events = useCalendarStore((s) => s.events);
  const todos = useTodoStore((s) => s.todos);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  const markedDates = useMemo(() => {
    const marks: Record<string, string[]> = {};
    const addMark = (items: Array<{ startDate: string; endDate: string; color: string }>) => {
      items.forEach((item) => {
        const range = [item.startDate, ...getIntermediateDates(item.startDate, item.endDate), item.endDate];
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

  const selectedDateTodos = useMemo(() => {
    return todos.filter(
      (t) =>
        t.workspaceId === currentWorkspace?.id &&
        selectedDate >= t.startDate &&
        selectedDate <= t.endDate
    );
  }, [todos, currentWorkspace?.id, selectedDate]);

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
          <button
            onClick={() => router.push("/todo/create")}
            className={styles.controlButton}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <Card className={styles.calendarCard}>
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

        <div className={styles.days}>
          {calendarDays.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} />;
            const dayOfWeek = dayjs(date).day();
            const isSelected = date === selectedDate;
            const isToday = date === today;
            const dots = markedDates[date] || [];

            return (
              <button key={date} onClick={() => setSelectedDate(date)} className={styles.dayButton}>
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
                {dots.length > 0 && (
                  <div className={styles.dots}>
                    {dots.slice(0, 3).map((color, i) => (
                      <div
                        key={i}
                        className={styles.dot}
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

      <div className={styles.todoSection}>
        <h2 className={styles.todoTitle}>{formatDate(selectedDate, "M월 D일")} 할 일</h2>
        <TodoList
          todos={selectedDateTodos}
          currentWorkspace={currentWorkspace}
          initialDate={selectedDate}
        />
      </div>
    </div>
  );
}

"use client";

import { useCallback } from "react";

import { useRouter } from "next/navigation";

import { CalendarGrid } from "@/features/calendar/components/CalendarGrid";
import { CalendarHeader } from "@/features/calendar/components/CalendarHeader";
import { useCalendar } from "@/features/calendar/hooks/useCalendar";
import { TodoList } from "@/features/todo/components/TodoList";
import { AppHeader } from "@/components/layout/AppHeader";
import { ROUTES } from "@/constants/routes";
import { formatDate } from "@/utils/date";

import styles from "./CalendarView.module.scss";

export const CalendarView = () => {
  const router = useRouter();
  const {
    today,
    selectedDate,
    currentMonth,
    filter,
    setFilter,
    markedDates,
    calendarDays,
    selectedDateTodos,
    isTodosPending,
    isTodosError,
    currentWorkspace,
    selectDate,
    moveMonth,
    toggleTodo,
  } = useCalendar();

  /** 선택일을 초기값으로 할 일 생성 화면으로 이동한다 */
  const handleAddEvent = useCallback(
    () => router.push(ROUTES.TODO.CREATE.query({ initialDate: selectedDate })),
    [router, selectedDate]
  );

  return (
    <div className={styles.page}>
      <AppHeader />

      <CalendarHeader
        currentMonth={currentMonth}
        onMoveMonth={moveMonth}
        onAddEvent={handleAddEvent}
      />

      <CalendarGrid
        days={calendarDays}
        selectedDate={selectedDate}
        today={today}
        markedDates={markedDates}
        onSelectDate={selectDate}
      />

      <div className={styles.todoSection}>
        <h2 className={styles.todoTitle}>{formatDate(selectedDate, "M월 D일")} 할 일</h2>
        <TodoList
          todos={selectedDateTodos}
          currentWorkspace={currentWorkspace}
          initialDate={selectedDate}
          filter={filter}
          isPending={isTodosPending}
          isError={isTodosError}
          onFilterChange={setFilter}
          onToggle={toggleTodo}
        />
      </div>
    </div>
  );
};

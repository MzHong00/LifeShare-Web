"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { calendarQueries } from "@/features/calendar/queries/calendarQueries";
import { todoQueries } from "@/features/todo/queries/todoQueries";
import { useTodoToggle } from "@/features/todo/hooks/useTodoToggle";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { COLORS } from "@/constants/theme";
import { useQueryParams } from "@/hooks/useQueryParams";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { addMonths, getCalendarDays, getTodayDateString } from "@/utils/date";
import { buildMarkedDates } from "@/features/calendar/utils/calendarUtils";

import type { Filter } from "@/features/todo/components/TodoList";

const MONTH_KEY_LENGTH = 7; // "YYYY-MM" 슬라이스 길이

/**
 * 캘린더 화면의 날짜 선택·월 이동 상태와 파생 데이터(달력 셀, 날짜별 점, 선택일 할 일)를 관리한다.
 */
export const useCalendar = () => {
  const today = getTodayDateString(); // 오늘 날짜 문자열 (YYYY-MM-DD)
  const [params, setParams] = useQueryParams();
  const dateParam = params.get("date") || today; // URL 쿼리의 선택 날짜

  const [selectedDate, setSelectedDate] = useState(dateParam); // 현재 선택된 날짜
  const [currentMonth, setCurrentMonth] = useState(dateParam.substring(0, MONTH_KEY_LENGTH)); // 표시 중인 월
  const [filter, setFilter] = useState<Filter>("all"); // 할 일 목록 필터
  const dateParamChanged = useResetOnChange(dateParam);

  // 브라우저 뒤로가기/앞으로가기 등 훅 외부 요인으로 URL의 date가 바뀌면, 표시 중인 선택일/월이 그대로 남는 것을 방지
  if (dateParamChanged) {
    setSelectedDate(dateParam);
    setCurrentMonth(dateParam.substring(0, MONTH_KEY_LENGTH));
  }

  const { currentWorkspace } = useCurrentWorkspace();
  const { data: events = [] } = useQuery(calendarQueries.list(currentWorkspace?.id ?? ""));
  const {
    data: todos = [],
    isPending: isTodosPending,
    isError: isTodosError,
  } = useQuery(todoQueries.list(currentWorkspace?.id ?? ""));
  const { toggleTodo } = useTodoToggle(currentWorkspace?.id ?? "", todos);

  // 이벤트·할 일을 날짜별 색상 점 맵으로 변환
  const markedDates = useMemo(
    () =>
      buildMarkedDates([
        ...events,
        ...todos.map((t) => ({
          startDate: t.startDate,
          endDate: t.endDate,
          color: t.color || COLORS.primary,
        })),
      ]),
    [events, todos]
  );

  // 표시 중인 월의 달력 셀 배열 (앞뒤 빈칸 포함)
  const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);

  // 선택일이 기간에 포함되는 할 일 (쿼리가 이미 워크스페이스 범위로 조회)
  const selectedDateTodos = useMemo(
    () => todos.filter((t) => selectedDate >= t.startDate && selectedDate <= t.endDate),
    [todos, selectedDate]
  );

  /** 날짜를 선택하고 필터를 초기화한 뒤 URL 쿼리에 반영한다 */
  const selectDate = useCallback(
    (date: string) => {
      setSelectedDate(date);
      setFilter("all");
      setParams.set("date", date);
    },
    [setParams]
  );

  /** 표시 월을 delta만큼 이동한다 */
  const moveMonth = useCallback((delta: number) => setCurrentMonth((m) => addMonths(m, delta)), []);

  return {
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
  };
};

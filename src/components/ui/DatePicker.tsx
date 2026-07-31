"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ICON_SIZE } from "@/constants/iconSize";
import { CalendarDayCell } from "@/features/calendar/components/CalendarDayCell";
import { addMonths, formatYearMonth, getCalendarDays, getTodayDateString } from "@/utils/date";
import { cx } from "@/utils/cn";

import styles from "./DatePicker.module.scss";

interface DatePickerProps {
  initialDate: string; // 오픈 시 초기 선택 날짜
  /** 날짜 선택 변경 핸들러 */
  onChangeDate: (date: string) => void;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const SUNDAY = 0; // 일요일 인덱스
const SATURDAY = 6; // 토요일 인덱스
const NO_DOT_COLORS: string[] = []; // 이 데이트피커에서는 일정 마킹이 필요 없음(고정 참조)
const PREV_MONTH = -1; // 이전 달 이동 delta
const NEXT_MONTH = 1; // 다음 달 이동 delta
const MONTH_KEY_LENGTH = 7; // "YYYY-MM" 슬라이스 길이
const CALENDAR_GRID_CELL_COUNT = 42; // 6주 × 7일 — 월마다 주 수가 달라 그리드 높이가 바뀌는 것을 막기 위한 고정 셀 수

/**
 * 월 이동 헤더 + 요일 라벨 + 날짜 그리드로 구성된 공통 데이트피커.
 * 요일 라벨·날짜 그리드가 헤더와 같은 좌우 padding을 공유하도록 CalendarGrid(카드형)를 감싸지 않고
 * CalendarDayCell만 재사용해 직접 구성한다.
 */
export const DatePicker = ({ initialDate, onChangeDate }: DatePickerProps) => {
  const today = getTodayDateString(); // 오늘 날짜 문자열
  const startDate = initialDate || today;
  const [selectedDate, setSelectedDate] = useState(startDate);
  const [currentMonth, setCurrentMonth] = useState(startDate.substring(0, MONTH_KEY_LENGTH));

  // 표시 중인 월의 달력 셀 배열 — 항상 6주(42칸)로 뒤를 채워, 5주짜리 달에서도 그리드 높이가 흔들리지 않게 한다
  const calendarDays = useMemo(() => {
    const days = getCalendarDays(currentMonth);
    const trailingBlanks = Array<null>(CALENDAR_GRID_CELL_COUNT - days.length).fill(null);
    return [...days, ...trailingBlanks];
  }, [currentMonth]);

  const moveMonth = (delta: number) => setCurrentMonth((m) => addMonths(m, delta));

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    onChangeDate(date);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.calendarBody}>
        <div className={styles.header}>
          <button
            onClick={() => moveMonth(PREV_MONTH)}
            className={styles.controlButton}
            aria-label="이전 달"
          >
            <ChevronLeft size={ICON_SIZE.md} />
          </button>
          <h3 className={styles.monthTitle}>{formatYearMonth(currentMonth)}</h3>
          <button
            onClick={() => moveMonth(NEXT_MONTH)}
            className={styles.controlButton}
            aria-label="다음 달"
          >
            <ChevronRight size={ICON_SIZE.md} />
          </button>
        </div>

        <div className={styles.weekdays}>
          {WEEKDAYS.map((day, i) => (
            <div
              key={day}
              className={cx(
                styles.weekday,
                i === SUNDAY && styles.weekdaySun,
                i === SATURDAY && styles.weekdaySat
              )}
            >
              {day}
            </div>
          ))}
        </div>

        <div className={styles.days}>
          {calendarDays.map((date, idx) =>
            date ? (
              <CalendarDayCell
                key={date}
                date={date}
                isSelected={date === selectedDate}
                isToday={date === today}
                dotColors={NO_DOT_COLORS}
                onSelect={handleSelectDate}
              />
            ) : (
              <div key={`empty-${idx}`} />
            )
          )}
        </div>
      </div>
    </div>
  );
};

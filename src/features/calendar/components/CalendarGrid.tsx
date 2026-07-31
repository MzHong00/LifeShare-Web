import { memo } from "react";

import { Card } from "@/components/ui/Card";
import { cx } from "@/utils/cn";

import { CalendarDayCell } from "./CalendarDayCell";
import styles from "./CalendarGrid.module.scss";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const SUNDAY = 0; // 일요일 인덱스
const SATURDAY = 6; // 토요일 인덱스
const EMPTY_DOT_COLORS: string[] = []; // dotColors 미존재 시 재사용할 고정 참조(CalendarDayCell memo 무효화 방지)

interface CalendarGridProps {
  days: Array<string | null>; // 달력 셀 날짜 배열 (빈칸은 null)
  selectedDate: string; // 선택된 날짜
  today: string; // 오늘 날짜
  markedDates: Record<string, string[]>; // 날짜별 일정 색상 점
  /** 날짜 선택 핸들러 */
  onSelectDate: (date: string) => void;
}

// TodoList 필터 변경 등 부모(CalendarView) 리렌더 시 props 참조가 그대로면 그리드 재계산을 건너뛴다
const CalendarGridComponent = ({
  days,
  selectedDate,
  today,
  markedDates,
  onSelectDate,
}: CalendarGridProps) => {
  return (
    <Card className={styles.calendarCard}>
      <div className={styles.weekdays}>
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={cx(
              styles.weekday,
              i === SUNDAY && styles.weekdaySun,
              i === SATURDAY && styles.weekdaySat,
              i !== SUNDAY && i !== SATURDAY && styles.weekdayDefault
            )}
          >
            {day}
          </div>
        ))}
      </div>

      <div className={styles.days}>
        {days.map((date, idx) =>
          date ? (
            <CalendarDayCell
              key={date}
              date={date}
              isSelected={date === selectedDate}
              isToday={date === today}
              dotColors={markedDates[date] || EMPTY_DOT_COLORS}
              onSelect={onSelectDate}
            />
          ) : (
            <div key={`empty-${idx}`} />
          )
        )}
      </div>
    </Card>
  );
};

export const CalendarGrid = memo(CalendarGridComponent);
CalendarGrid.displayName = "CalendarGrid";

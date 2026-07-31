import { getIntermediateDates } from "@/utils/date";

import type { CalendarEvent } from "@/features/calendar/types/calendar";

export interface CalendarEventRow {
  id: string;
  workspace_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  is_all_day: boolean;
  color: string;
  created_at: string;
}

/** Supabase row를 앱의 CalendarEvent 타입으로 변환한다 */
export const rowToEvent = (row: CalendarEventRow): CalendarEvent => ({
  id: row.id,
  workspaceId: row.workspace_id,
  title: row.title,
  description: row.description,
  startDate: row.start_date,
  endDate: row.end_date,
  startTime: row.start_time,
  endTime: row.end_time,
  isAllDay: row.is_all_day,
  color: row.color,
  createdAt: row.created_at,
});

interface DateRangeItem {
  startDate: string;
  endDate: string;
  color: string;
}

/** 시작·종료일 범위에 속한 모든 날짜별로 색상 점을 누적한다 */
export const buildMarkedDates = (items: DateRangeItem[]): Record<string, string[]> => {
  const marks: Record<string, string[]> = {};
  items.forEach((item) => {
    const range = [
      item.startDate,
      ...getIntermediateDates(item.startDate, item.endDate),
      item.endDate,
    ];
    [...new Set(range)].forEach((date) => {
      if (!marks[date]) marks[date] = [];
      if (!marks[date].includes(item.color)) marks[date].push(item.color);
    });
  });
  return marks;
};

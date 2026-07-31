import dayjs from "dayjs";
import "dayjs/locale/ko";

dayjs.locale("ko");

const D_DAY_OFFSET = 1; // 시작일을 D-1로 세는 보정값 (당일 = 1일째)

const RELATIVE_DATE_LABEL = {
  TODAY: "오늘까지",
  TOMORROW: "내일까지",
  YESTERDAY: "어제까지",
  DELAYED_SUFFIX: "일 지연",
} as const;

export const getTodayDateString = (): string => {
  return dayjs().format("YYYY-MM-DD");
};

export const getDateWithOffset = (
  days: number,
  baseDate: string = getTodayDateString()
): string => {
  return dayjs(baseDate).add(days, "day").format("YYYY-MM-DD");
};

export const calculateDDay = (startDate: string): number => {
  if (!startDate) return 0;
  const start = dayjs(startDate).startOf("day");
  const today = dayjs().startOf("day");
  return today.diff(start, "day") + D_DAY_OFFSET;
};

export const formatDate = (
  dateString: string | null | undefined,
  format: string = "YYYY.MM.DD"
): string => {
  if (!dateString) return "";
  return dayjs(dateString).format(format);
};

export const getRelativeDateLabel = (dateStr: string): string => {
  if (!dateStr) return "";
  const today = dayjs().startOf("day");
  const target = dayjs(dateStr).startOf("day");
  const diffDays = target.diff(today, "day");

  if (diffDays === 0) return RELATIVE_DATE_LABEL.TODAY;
  if (diffDays === 1) return RELATIVE_DATE_LABEL.TOMORROW;
  if (diffDays === -1) return RELATIVE_DATE_LABEL.YESTERDAY;
  if (diffDays < 0) return `${Math.abs(diffDays)}${RELATIVE_DATE_LABEL.DELAYED_SUFFIX}`;

  return dayjs(dateStr).format("M/D") + "까지";
};

export const isPastDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  return dayjs(dateStr).isBefore(dayjs(), "day");
};

// isPastDate와 달리 day 단위로 반올림하지 않고, 초/시각까지 정확히 비교한다 (timestamptz 값 비교용)
export const isPastTimestamp = (timestamp: string): boolean => {
  return dayjs(timestamp).isBefore(dayjs());
};

export const isToday = (dateStr: string): boolean => {
  if (!dateStr) return false;
  return dayjs(dateStr).isSame(dayjs(), "day");
};

export const isThisMonth = (dateStr: string): boolean => {
  if (!dateStr) return false;
  return dayjs(dateStr).isSame(dayjs(), "month");
};

export const getIntermediateDates = (startDate: string, endDate: string): string[] => {
  const start = dayjs(startDate).add(1, "day");
  // start(시작 다음 날)부터 endDate 전날까지의 일수
  const count = Math.max(0, dayjs(endDate).diff(start, "day"));
  return Array.from({ length: count }, (_, i) => start.add(i, "day").format("YYYY-MM-DD"));
};

export const formatChatTime = (date: string | Date = new Date()): string => {
  return dayjs(date).format("A h:mm").replace("AM", "오전").replace("PM", "오후");
};

export const getISOTimestamp = (): string => {
  return dayjs().toISOString();
};

export const getDaysUntil = (dateString: string): number => {
  return dayjs(dateString).startOf("day").diff(dayjs().startOf("day"), "day");
};

export const addYears = (dateString: string, years: number): string => {
  return dayjs(dateString).add(years, "year").format("YYYY-MM-DD");
};

export const getCalendarDays = (yearMonth: string): (string | null)[] => {
  const month = dayjs(yearMonth);
  const startOfMonth = month.startOf("month");
  const daysInMonth = month.daysInMonth();
  const startDay = startOfMonth.day();
  const leadingBlanks: (string | null)[] = Array(startDay).fill(null);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) =>
    month.date(i + 1).format("YYYY-MM-DD")
  );
  return [...leadingBlanks, ...monthDays];
};

export const formatYearMonth = (yearMonth: string): string => {
  return dayjs(yearMonth).format("YYYY년 M월");
};

export const addMonths = (yearMonth: string, delta: number): string => {
  return dayjs(yearMonth).add(delta, "month").format("YYYY-MM");
};

export const getDayOfWeek = (dateString: string): number => {
  return dayjs(dateString).day();
};

export const getDayNumber = (dateString: string): number => {
  return dayjs(dateString).date();
};

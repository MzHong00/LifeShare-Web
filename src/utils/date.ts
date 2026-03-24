import dayjs from "dayjs";
import "dayjs/locale/ko";

dayjs.locale("ko");

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
  return today.diff(start, "day") + 1;
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

  if (diffDays === 0) return "오늘까지";
  if (diffDays === 1) return "내일까지";
  if (diffDays === -1) return "어제까지";
  if (diffDays < 0) return `${Math.abs(diffDays)}일 지연`;

  return dayjs(dateStr).format("M/D") + "까지";
};

export const isPastDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  return dayjs(dateStr).isBefore(dayjs(), "day");
};

export const getIntermediateDates = (
  startDate: string,
  endDate: string
): string[] => {
  const dates: string[] = [];
  let current = dayjs(startDate).add(1, "day");
  const last = dayjs(endDate);

  while (current.isBefore(last, "day")) {
    dates.push(current.format("YYYY-MM-DD"));
    current = current.add(1, "day");
  }

  return dates;
};

export const formatChatTime = (date: string | Date = new Date()): string => {
  return dayjs(date)
    .format("A h:mm")
    .replace("AM", "오전")
    .replace("PM", "오후");
};

export const getISOTimestamp = (): string => {
  return dayjs().toISOString();
};

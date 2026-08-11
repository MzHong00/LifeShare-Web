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

/** 오늘 날짜를 "YYYY-MM-DD" 형식으로 반환한다 */
export const getTodayDateString = (): string => {
  return dayjs().format("YYYY-MM-DD");
};

/** 기준일(기본값: 오늘)에서 days일만큼 이동한 날짜를 "YYYY-MM-DD" 형식으로 반환한다 */
export const getDateWithOffset = (
  days: number,
  baseDate: string = getTodayDateString()
): string => {
  return dayjs(baseDate).add(days, "day").format("YYYY-MM-DD");
};

/** 시작일 기준 D-Day(경과 일수, 당일 = 1일째)를 계산한다 */
export const calculateDDay = (startDate: string): number => {
  if (!startDate) return 0;
  const start = dayjs(startDate).startOf("day");
  const today = dayjs().startOf("day");
  return today.diff(start, "day") + D_DAY_OFFSET;
};

/** 날짜 문자열을 지정된 포맷(기본: "YYYY.MM.DD")으로 변환한다 */
export const formatDate = (
  dateString: string | null | undefined,
  format: string = "YYYY.MM.DD"
): string => {
  if (!dateString) return "";
  return dayjs(dateString).format(format);
};

/** 오늘 기준 상대적인 날짜 라벨(오늘까지/내일까지/N일 지연 등)을 반환한다 */
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

/** 대상 날짜가 오늘보다 이전인지(day 단위로 반올림하여) 판단한다 */
export const isPastDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  return dayjs(dateStr).isBefore(dayjs(), "day");
};

/** isPastDate와 달리 day 단위로 반올림하지 않고, 초/시각까지 정확히 비교한다 (timestamptz 값 비교용) */
export const isPastTimestamp = (timestamp: string): boolean => {
  return dayjs(timestamp).isBefore(dayjs());
};

/** 대상 날짜가 오늘인지 판단한다 */
export const isToday = (dateStr: string): boolean => {
  if (!dateStr) return false;
  return dayjs(dateStr).isSame(dayjs(), "day");
};

/** 대상 날짜가 이번 달인지 판단한다 */
export const isThisMonth = (dateStr: string): boolean => {
  if (!dateStr) return false;
  return dayjs(dateStr).isSame(dayjs(), "month");
};

/** 시작일 다음 날부터 종료일 전날까지의 날짜 목록을 반환한다 */
export const getIntermediateDates = (startDate: string, endDate: string): string[] => {
  const start = dayjs(startDate).add(1, "day");
  // start(시작 다음 날)부터 endDate 전날까지의 일수
  const count = Math.max(0, dayjs(endDate).diff(start, "day"));
  return Array.from({ length: count }, (_, i) => start.add(i, "day").format("YYYY-MM-DD"));
};

/** 채팅용 시각 포맷("오전/오후 h:mm")으로 변환한다 */
export const formatChatTime = (date: string | Date = new Date()): string => {
  return dayjs(date).format("A h:mm").replace("AM", "오전").replace("PM", "오후");
};

/** 현재 시각의 ISO 문자열을 반환한다 */
export const getISOTimestamp = (): string => {
  return dayjs().toISOString();
};

/** 오늘부터 대상 날짜까지 남은 일수를 계산한다 */
export const getDaysUntil = (dateString: string): number => {
  return dayjs(dateString).startOf("day").diff(dayjs().startOf("day"), "day");
};

/** 날짜 문자열에 years년을 더한 날짜를 "YYYY-MM-DD" 형식으로 반환한다 */
export const addYears = (dateString: string, years: number): string => {
  return dayjs(dateString).add(years, "year").format("YYYY-MM-DD");
};

/** 해당 월의 달력 칸 배열(앞쪽 빈 칸 + 각 날짜)을 반환한다 */
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

/** "YYYY-MM" 문자열을 "YYYY년 M월" 형식으로 변환한다 */
export const formatYearMonth = (yearMonth: string): string => {
  return dayjs(yearMonth).format("YYYY년 M월");
};

/** "YYYY-MM" 문자열에 delta개월을 더한 "YYYY-MM"을 반환한다 */
export const addMonths = (yearMonth: string, delta: number): string => {
  return dayjs(yearMonth).add(delta, "month").format("YYYY-MM");
};

/** 날짜의 요일(0=일요일 ~ 6=토요일)을 반환한다 */
export const getDayOfWeek = (dateString: string): number => {
  return dayjs(dateString).day();
};

/** 날짜의 일(day of month)을 반환한다 */
export const getDayNumber = (dateString: string): number => {
  return dayjs(dateString).date();
};

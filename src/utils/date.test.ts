import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addMonths,
  addYears,
  calculateDDay,
  formatChatTime,
  formatDate,
  formatYearMonth,
  getCalendarDays,
  getDateWithOffset,
  getDayNumber,
  getDayOfWeek,
  getDaysUntil,
  getISOTimestamp,
  getIntermediateDates,
  getRelativeDateLabel,
  getTodayDateString,
  isPastDate,
  isPastTimestamp,
  isThisMonth,
  isToday,
} from "./date";

// 시각 의존 테스트가 실행 시점에 따라 깨지지 않도록 고정하는 기준 시각 (2026-02-15 10:30 로컬)
const FIXED_NOW = new Date(2026, 1, 15, 10, 30, 0);

describe("calculateDDay", () => {
  it("빈 문자열이면 0을 반환한다", () => {
    expect(calculateDDay("")).toBe(0);
  });

  it("오늘 날짜를 시작일로 주면 D-1을 반환한다", () => {
    expect(calculateDDay(getTodayDateString())).toBe(1);
  });
});

describe("formatDate", () => {
  it("빈 값이면 빈 문자열을 반환한다", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate(undefined)).toBe("");
  });

  it("기본 포맷으로 날짜를 포맷팅한다", () => {
    expect(formatDate("2026-01-05")).toBe("2026.01.05");
  });

  it("포맷을 지정하면 해당 포맷으로 반환한다", () => {
    expect(formatDate("2026-01-05", "YYYY-MM-DD")).toBe("2026-01-05");
  });
});

describe("getRelativeDateLabel", () => {
  it("빈 문자열이면 빈 문자열을 반환한다", () => {
    expect(getRelativeDateLabel("")).toBe("");
  });

  it("지난 날짜는 지연 일수를 표시한다", () => {
    const twoDaysAgo = getDateWithOffset(-2);
    expect(getRelativeDateLabel(twoDaysAgo)).toBe("2일 지연");
  });
});

describe("isPastDate", () => {
  it("빈 문자열이면 false를 반환한다", () => {
    expect(isPastDate("")).toBe(false);
  });

  it("과거 날짜는 true를 반환한다", () => {
    expect(isPastDate("2000-01-01")).toBe(true);
  });

  it("미래 날짜는 false를 반환한다", () => {
    expect(isPastDate("2999-01-01")).toBe(false);
  });
});

describe("getIntermediateDates", () => {
  it("시작일과 종료일 사이의 날짜를 반환한다", () => {
    expect(getIntermediateDates("2026-01-01", "2026-01-04")).toEqual(["2026-01-02", "2026-01-03"]);
  });

  it("연속된 날짜면 빈 배열을 반환한다", () => {
    expect(getIntermediateDates("2026-01-01", "2026-01-02")).toEqual([]);
  });
});

describe("고정 시각 기반 날짜 유틸", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getTodayDateString", () => {
    it("오늘 날짜를 YYYY-MM-DD로 반환한다", () => {
      expect(getTodayDateString()).toBe("2026-02-15");
    });
  });

  describe("getDateWithOffset", () => {
    it("기준일 없이 호출하면 오늘 기준으로 계산한다", () => {
      expect(getDateWithOffset(1)).toBe("2026-02-16");
      expect(getDateWithOffset(-1)).toBe("2026-02-14");
    });

    it("월말을 넘기면 다음 달로 넘어간다", () => {
      expect(getDateWithOffset(1, "2026-02-28")).toBe("2026-03-01");
    });

    it("윤년 2월 말일을 정확히 계산한다", () => {
      expect(getDateWithOffset(1, "2024-02-28")).toBe("2024-02-29");
    });
  });

  describe("calculateDDay", () => {
    it("과거 시작일이면 경과 일수에 1을 더해 반환한다", () => {
      expect(calculateDDay("2026-02-13")).toBe(3);
    });

    it("미래 시작일이면 음수를 반환한다", () => {
      expect(calculateDDay("2026-02-18")).toBe(-2);
    });
  });

  describe("getRelativeDateLabel", () => {
    it("오늘이면 오늘까지를 반환한다", () => {
      expect(getRelativeDateLabel("2026-02-15")).toBe("오늘까지");
    });

    it("내일이면 내일까지를 반환한다", () => {
      expect(getRelativeDateLabel("2026-02-16")).toBe("내일까지");
    });

    it("어제면 어제까지를 반환한다", () => {
      expect(getRelativeDateLabel("2026-02-14")).toBe("어제까지");
    });

    it("모레 이후의 미래는 월/일까지 형태로 반환한다", () => {
      expect(getRelativeDateLabel("2026-02-20")).toBe("2/20까지");
    });
  });

  describe("isPastDate", () => {
    it("오늘 날짜는 false를 반환한다", () => {
      expect(isPastDate("2026-02-15")).toBe(false);
    });
  });

  describe("isPastTimestamp", () => {
    it("현재보다 이전 시각이면 true를 반환한다", () => {
      expect(isPastTimestamp(new Date(2026, 1, 15, 10, 29, 59).toISOString())).toBe(true);
    });

    it("현재보다 이후 시각이면 false를 반환한다", () => {
      expect(isPastTimestamp(new Date(2026, 1, 15, 10, 30, 1).toISOString())).toBe(false);
    });

    it("같은 날이어도 시각이 지났으면 true를 반환한다", () => {
      expect(isPastTimestamp(new Date(2026, 1, 15, 0, 0, 0).toISOString())).toBe(true);
    });
  });

  describe("isToday", () => {
    it("빈 문자열이면 false를 반환한다", () => {
      expect(isToday("")).toBe(false);
    });

    it("오늘이면 true를 반환한다", () => {
      expect(isToday("2026-02-15")).toBe(true);
    });

    it("다른 날이면 false를 반환한다", () => {
      expect(isToday("2026-02-16")).toBe(false);
    });
  });

  describe("isThisMonth", () => {
    it("빈 문자열이면 false를 반환한다", () => {
      expect(isThisMonth("")).toBe(false);
    });

    it("같은 달이면 true를 반환한다", () => {
      expect(isThisMonth("2026-02-01")).toBe(true);
      expect(isThisMonth("2026-02-28")).toBe(true);
    });

    it("다른 달이면 false를 반환한다", () => {
      expect(isThisMonth("2026-03-01")).toBe(false);
      expect(isThisMonth("2025-02-15")).toBe(false);
    });
  });

  describe("getIntermediateDates", () => {
    it("종료일이 시작일보다 빠르면 빈 배열을 반환한다", () => {
      expect(getIntermediateDates("2026-01-10", "2026-01-01")).toEqual([]);
    });

    it("월말을 넘어가는 구간도 이어서 반환한다", () => {
      expect(getIntermediateDates("2026-01-30", "2026-02-02")).toEqual([
        "2026-01-31",
        "2026-02-01",
      ]);
    });
  });

  describe("formatChatTime", () => {
    it("인자가 없으면 현재 시각을 오전/오후 형식으로 반환한다", () => {
      expect(formatChatTime()).toBe("오전 10:30");
    });

    it("Date 객체를 받아 오후 시각을 포맷팅한다", () => {
      expect(formatChatTime(new Date(2026, 1, 15, 21, 5, 0))).toBe("오후 9:05");
    });

    it("자정은 오전 12:00으로 표기한다", () => {
      expect(formatChatTime(new Date(2026, 1, 15, 0, 0, 0))).toBe("오전 12:00");
    });
  });

  describe("getISOTimestamp", () => {
    it("현재 시각의 ISO 문자열을 반환한다", () => {
      expect(getISOTimestamp()).toBe(FIXED_NOW.toISOString());
    });
  });

  describe("getDaysUntil", () => {
    it("미래 날짜는 남은 일수를 양수로 반환한다", () => {
      expect(getDaysUntil("2026-02-20")).toBe(5);
    });

    it("오늘은 0을 반환한다", () => {
      expect(getDaysUntil("2026-02-15")).toBe(0);
    });

    it("과거 날짜는 음수를 반환한다", () => {
      expect(getDaysUntil("2026-02-10")).toBe(-5);
    });
  });
});

describe("addYears", () => {
  it("연도를 더한 날짜를 반환한다", () => {
    expect(addYears("2026-01-05", 1)).toBe("2027-01-05");
  });

  it("윤년 2월 29일에 1년을 더하면 2월 28일이 된다", () => {
    expect(addYears("2024-02-29", 1)).toBe("2025-02-28");
  });

  it("음수를 주면 과거 연도를 반환한다", () => {
    expect(addYears("2026-01-05", -2)).toBe("2024-01-05");
  });
});

describe("getCalendarDays", () => {
  it("월 시작 요일만큼 앞에 null을 채운다", () => {
    const days = getCalendarDays("2026-02");
    expect(days).toHaveLength(28);
    expect(days[0]).toBe("2026-02-01");
    expect(days[27]).toBe("2026-02-28");
  });

  it("윤년 2월은 29일까지 포함한다", () => {
    const days = getCalendarDays("2024-02");
    const leadingBlanks = days.filter((day) => day === null);
    expect(leadingBlanks).toHaveLength(4);
    expect(days).toHaveLength(33);
    expect(days[days.length - 1]).toBe("2024-02-29");
  });

  it("31일까지 있는 달을 모두 반환한다", () => {
    const days = getCalendarDays("2026-01");
    expect(days.filter((day) => day !== null)).toHaveLength(31);
  });
});

describe("formatYearMonth", () => {
  it("한글 연월 형식으로 반환한다", () => {
    expect(formatYearMonth("2026-02")).toBe("2026년 2월");
    expect(formatYearMonth("2026-12")).toBe("2026년 12월");
  });
});

describe("addMonths", () => {
  it("다음 달로 넘어가면 연도가 증가한다", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
  });

  it("이전 달로 넘어가면 연도가 감소한다", () => {
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });

  it("0을 주면 같은 달을 반환한다", () => {
    expect(addMonths("2026-05", 0)).toBe("2026-05");
  });
});

describe("getDayOfWeek", () => {
  it("일요일은 0을 반환한다", () => {
    expect(getDayOfWeek("2026-02-15")).toBe(0);
  });

  it("토요일은 6을 반환한다", () => {
    expect(getDayOfWeek("2026-02-21")).toBe(6);
  });
});

describe("getDayNumber", () => {
  it("날짜의 일(day)을 반환한다", () => {
    expect(getDayNumber("2026-02-15")).toBe(15);
  });

  it("월말 날짜도 정확히 반환한다", () => {
    expect(getDayNumber("2026-01-31")).toBe(31);
  });
});

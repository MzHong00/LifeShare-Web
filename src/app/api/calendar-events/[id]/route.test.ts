import { beforeEach, describe, expect, it, vi } from "vitest";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";
import { calendarEventRepository } from "@/server/domain/calendar/repository";

import { DELETE, PATCH } from "./route";

import type { NextRequest } from "next/server";
import type { PostgrestError } from "@supabase/supabase-js";
import type { User } from "@/types/user";
import type { CalendarEventRow } from "@/features/calendar/utils/calendarUtils";
import type { CalendarEventUpdateRequestDto } from "@/server/domain/calendar/dto";

vi.mock("@/server/common/utils/supabaseClient", () => ({
  createServerSupabase: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock("@/server/domain/calendar/repository", () => ({
  calendarEventRepository: {
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const EVENT_ID = "event-1"; // 테스트용 일정 id

const ERROR_FIELDS = {
  name: "PostgrestError",
  message: "실패",
  details: "",
  hint: "",
  code: "PGRST000",
};
const ERROR: PostgrestError = { ...ERROR_FIELDS, toJSON: () => ERROR_FIELDS };

const NOT_FOUND_ERROR_FIELDS = { ...ERROR_FIELDS, code: "PGRST116" };
const NOT_FOUND_ERROR: PostgrestError = {
  ...NOT_FOUND_ERROR_FIELDS,
  toJSON: () => NOT_FOUND_ERROR_FIELDS,
};

const SESSION_USER: User = { id: "user-1", name: "나", email: "me@test.com" };

const EVENT_ROW: CalendarEventRow = {
  id: EVENT_ID,
  workspace_id: "ws-1",
  title: "제목",
  start_date: "2020-01-01",
  end_date: "2020-01-02",
  is_all_day: true,
  color: "#fff",
  created_at: "2020-01-01T00:00:00Z",
};

const UPDATE_BODY: CalendarEventUpdateRequestDto = { title: "새 제목" };

/** RouteContext 모양의 컨텍스트를 만든다 */
const createContext = () => ({ params: Promise.resolve({ id: EVENT_ID }) });

/** json() 만 사용하는 라우트에 넘길 최소 요청 객체를 만든다 */
const createRequest = (body: unknown) => ({ json: async () => body }) as unknown as NextRequest;

const mockedCreateServerSupabase = vi.mocked(createServerSupabase);
const mockedGetSessionUser = vi.mocked(getSessionUser);
const mockedRepository = vi.mocked(calendarEventRepository);

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mockedCreateServerSupabase.mockResolvedValue(vi.fn() as never);
  mockedGetSessionUser.mockResolvedValue(SESSION_USER);
  mockedRepository.update.mockResolvedValue({
    data: EVENT_ROW,
    error: null,
  } as unknown as Awaited<ReturnType<typeof calendarEventRepository.update>>);
  mockedRepository.delete.mockResolvedValue({
    data: [EVENT_ROW],
    error: null,
  } as unknown as Awaited<ReturnType<typeof calendarEventRepository.delete>>);
});

describe("PATCH /api/calendar-events/[id]", () => {
  it("로그인하지 않았으면 401을 반환한다", async () => {
    mockedGetSessionUser.mockResolvedValue(null);

    const res = await PATCH(createRequest(UPDATE_BODY), createContext());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
  });

  it("일정 수정에 성공하면 200과 변환된 일정을 반환한다", async () => {
    const res = await PATCH(createRequest(UPDATE_BODY), createContext());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(expect.objectContaining({ id: EVENT_ID, title: "제목" }));
  });

  it("존재하지 않는 일정을 수정하려 하면 404를 반환한다", async () => {
    mockedRepository.update.mockResolvedValue({
      data: null,
      error: NOT_FOUND_ERROR,
    } as unknown as Awaited<ReturnType<typeof calendarEventRepository.update>>);

    const res = await PATCH(createRequest(UPDATE_BODY), createContext());

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "일정을 찾을 수 없습니다." });
  });

  it("DB 에러가 나면 500을 반환한다", async () => {
    mockedRepository.update.mockResolvedValue({
      data: null,
      error: ERROR,
    } as unknown as Awaited<ReturnType<typeof calendarEventRepository.update>>);

    const res = await PATCH(createRequest(UPDATE_BODY), createContext());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "일정 수정에 실패했습니다." });
  });
});

describe("DELETE /api/calendar-events/[id]", () => {
  it("로그인하지 않았으면 401을 반환한다", async () => {
    mockedGetSessionUser.mockResolvedValue(null);

    const res = await DELETE(createRequest(null), createContext());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
  });

  it("일정 삭제에 성공하면 204를 반환한다", async () => {
    const res = await DELETE(createRequest(null), createContext());

    expect(res.status).toBe(204);
  });

  it("삭제된 일정이 없으면 404를 반환한다", async () => {
    mockedRepository.delete.mockResolvedValue({
      data: [],
      error: null,
    } as unknown as Awaited<ReturnType<typeof calendarEventRepository.delete>>);

    const res = await DELETE(createRequest(null), createContext());

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "일정을 찾을 수 없습니다." });
  });

  it("DB 에러가 나면 500을 반환한다", async () => {
    mockedRepository.delete.mockResolvedValue({
      data: null,
      error: ERROR,
    } as unknown as Awaited<ReturnType<typeof calendarEventRepository.delete>>);

    const res = await DELETE(createRequest(null), createContext());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "일정 삭제에 실패했습니다." });
  });
});

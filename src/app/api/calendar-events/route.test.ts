import { beforeEach, describe, expect, it, vi } from "vitest";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";
import { calendarEventRepository } from "@/server/domain/calendar/repository";

import { GET, POST } from "./route";

import type { NextRequest } from "next/server";
import type { PostgrestError } from "@supabase/supabase-js";
import type { User } from "@/types/user";
import type { CalendarEventRow } from "@/features/calendar/utils/calendarUtils";
import type { CalendarEventCreateRequestDto } from "@/server/domain/calendar/dto";

vi.mock("@/server/common/utils/supabaseClient", () => ({
  createServerSupabase: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock("@/server/domain/calendar/repository", () => ({
  calendarEventRepository: {
    findManyByWorkspaceId: vi.fn(),
    create: vi.fn(),
  },
}));

const WORKSPACE_ID = "ws-1"; // 테스트용 워크스페이스 id

const ERROR_FIELDS = {
  name: "PostgrestError",
  message: "실패",
  details: "",
  hint: "",
  code: "PGRST000",
};
const ERROR: PostgrestError = { ...ERROR_FIELDS, toJSON: () => ERROR_FIELDS };

const SESSION_USER: User = { id: "user-1", name: "나", email: "me@test.com" };

const EVENT_ROW: CalendarEventRow = {
  id: "event-1",
  workspace_id: WORKSPACE_ID,
  title: "제목",
  start_date: "2020-01-01",
  end_date: "2020-01-02",
  is_all_day: true,
  color: "#fff",
  created_at: "2020-01-01T00:00:00Z",
};

const CREATE_BODY: CalendarEventCreateRequestDto = {
  workspaceId: WORKSPACE_ID,
  title: "제목",
  startDate: "2020-01-01",
  endDate: "2020-01-02",
  isAllDay: true,
  color: "#fff",
};

/** `?workspaceId=` 쿼리 파라미터만 사용하는 최소 요청 객체를 만든다 */
const createGetRequest = (workspaceId: string | null) =>
  ({
    nextUrl: { searchParams: new URLSearchParams(workspaceId ? { workspaceId } : {}) },
  }) as unknown as NextRequest;

/** json() 만 사용하는 라우트에 넘길 최소 요청 객체를 만든다 */
const createPostRequest = (body: unknown) => ({ json: async () => body }) as unknown as NextRequest;

const mockedCreateServerSupabase = vi.mocked(createServerSupabase);
const mockedGetSessionUser = vi.mocked(getSessionUser);
const mockedRepository = vi.mocked(calendarEventRepository);

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mockedCreateServerSupabase.mockResolvedValue(vi.fn() as never);
  mockedGetSessionUser.mockResolvedValue(SESSION_USER);
  mockedRepository.findManyByWorkspaceId.mockResolvedValue({
    data: [EVENT_ROW],
    error: null,
  } as unknown as Awaited<ReturnType<typeof calendarEventRepository.findManyByWorkspaceId>>);
  mockedRepository.create.mockResolvedValue({
    data: EVENT_ROW,
    error: null,
  } as unknown as Awaited<ReturnType<typeof calendarEventRepository.create>>);
});

describe("GET /api/calendar-events", () => {
  it("workspaceId가 없으면 400을 반환한다", async () => {
    const res = await GET(createGetRequest(null));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "workspaceId가 필요합니다." });
  });

  it("로그인하지 않았으면 401을 반환한다", async () => {
    mockedGetSessionUser.mockResolvedValue(null);

    const res = await GET(createGetRequest(WORKSPACE_ID));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
  });

  it("일정 목록 조회에 성공하면 200과 변환된 목록을 반환한다", async () => {
    const res = await GET(createGetRequest(WORKSPACE_ID));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      {
        id: "event-1",
        workspaceId: WORKSPACE_ID,
        title: "제목",
        description: undefined,
        startDate: "2020-01-01",
        endDate: "2020-01-02",
        startTime: undefined,
        endTime: undefined,
        isAllDay: true,
        color: "#fff",
        createdAt: "2020-01-01T00:00:00Z",
      },
    ]);
  });

  it("DB 에러가 나면 500을 반환한다", async () => {
    mockedRepository.findManyByWorkspaceId.mockResolvedValue({
      data: null,
      error: ERROR,
    } as unknown as Awaited<ReturnType<typeof calendarEventRepository.findManyByWorkspaceId>>);

    const res = await GET(createGetRequest(WORKSPACE_ID));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "일정 목록 조회에 실패했습니다." });
  });
});

describe("POST /api/calendar-events", () => {
  it("필수 파라미터가 없으면 400을 반환한다", async () => {
    const res = await POST(createPostRequest({ workspaceId: WORKSPACE_ID }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      message: "workspaceId, title, startDate, endDate는 필수입니다.",
    });
  });

  it("로그인하지 않았으면 401을 반환한다", async () => {
    mockedGetSessionUser.mockResolvedValue(null);

    const res = await POST(createPostRequest(CREATE_BODY));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
  });

  it("일정 생성에 성공하면 201과 변환된 일정을 반환한다", async () => {
    const res = await POST(createPostRequest(CREATE_BODY));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(
      expect.objectContaining({ id: "event-1", title: "제목", workspaceId: WORKSPACE_ID })
    );
  });

  it("DB 에러가 나면 500을 반환한다", async () => {
    mockedRepository.create.mockResolvedValue({
      data: null,
      error: ERROR,
    } as unknown as Awaited<ReturnType<typeof calendarEventRepository.create>>);

    const res = await POST(createPostRequest(CREATE_BODY));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "일정 생성에 실패했습니다." });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";

import { GET, POST } from "./route";

import type { NextRequest } from "next/server";
import type { SupabaseClient, PostgrestError } from "@supabase/supabase-js";
import type { User } from "@/types/user";

vi.mock("@/server/common/utils/supabaseClient", () => ({
  createServerSupabase: vi.fn(),
  getSessionUser: vi.fn(),
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

const TODO_ROW = {
  id: "todo-1",
  workspace_id: WORKSPACE_ID,
  title: "청소하기",
  description: undefined,
  is_completed: false,
  assignee_id: undefined,
  start_date: "2020-01-01",
  end_date: "2020-01-02",
  color: undefined,
  created_at: "2020-01-01T00:00:00.000Z",
};

// 마지막 체이닝 결과로 resolve되는 Supabase 쿼리 빌더 목
interface QueryResult {
  data?: unknown;
  error?: PostgrestError | null;
}

/** `.from().select().eq().order()` / `.from().insert().select().single()` 체이닝을 흉내내는 thenable 빌더를 만든다 */
const createQueryBuilder = (result: QueryResult) => {
  const builder: Record<string, unknown> = {
    then: (resolve: (value: QueryResult) => unknown) => Promise.resolve(result).then(resolve),
  };
  ["select", "eq", "order", "insert", "single"].forEach((method) => {
    builder[method] = () => builder;
  });
  return builder;
};

/** 체이닝 결과를 고정한 Supabase 클라이언트 목을 만든다 */
const createSupabaseMock = (result: QueryResult) =>
  ({ from: vi.fn(() => createQueryBuilder(result)) }) as unknown as SupabaseClient;

/** json()·nextUrl만 사용하는 라우트에 넘길 최소 요청 객체를 만든다 */
const createRequest = (body: unknown, workspaceId?: string) =>
  ({
    json: async () => body,
    nextUrl: new URL(
      `http://localhost/api/todos${workspaceId ? `?workspaceId=${workspaceId}` : ""}`
    ),
  }) as unknown as NextRequest;

const mockedCreateServerSupabase = vi.mocked(createServerSupabase);
const mockedGetSessionUser = vi.mocked(getSessionUser);

const CREATE_BODY = {
  workspaceId: WORKSPACE_ID,
  title: "청소하기",
  isCompleted: false,
  startDate: "2020-01-01",
  endDate: "2020-01-02",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mockedCreateServerSupabase.mockResolvedValue(createSupabaseMock({ data: [TODO_ROW] }));
  mockedGetSessionUser.mockResolvedValue(SESSION_USER);
});

describe("GET /api/todos", () => {
  it("workspaceId가 없으면 400을 반환한다", async () => {
    const res = await GET(createRequest(null));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "workspaceId가 필요합니다." });
  });

  it("로그인하지 않았으면 401을 반환한다", async () => {
    mockedGetSessionUser.mockResolvedValue(null);

    const res = await GET(createRequest(null, WORKSPACE_ID));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
  });

  it("목록 조회에 성공하면 200과 변환된 목록을 반환한다", async () => {
    const res = await GET(createRequest(null, WORKSPACE_ID));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      {
        id: "todo-1",
        workspaceId: WORKSPACE_ID,
        title: "청소하기",
        isCompleted: false,
        startDate: "2020-01-01",
        endDate: "2020-01-02",
        createdAt: "2020-01-01T00:00:00.000Z",
      },
    ]);
  });

  it("DB 에러가 나면 500을 반환한다", async () => {
    mockedCreateServerSupabase.mockResolvedValue(createSupabaseMock({ data: null, error: ERROR }));

    const res = await GET(createRequest(null, WORKSPACE_ID));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "할 일 목록 조회에 실패했습니다." });
  });
});

describe("POST /api/todos", () => {
  beforeEach(() => {
    mockedCreateServerSupabase.mockResolvedValue(createSupabaseMock({ data: TODO_ROW }));
  });

  it("필수 값이 없으면 400을 반환한다", async () => {
    const res = await POST(createRequest({ workspaceId: WORKSPACE_ID }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      message: "workspaceId, title, startDate, endDate는 필수입니다.",
    });
  });

  it("로그인하지 않았으면 401을 반환한다", async () => {
    mockedGetSessionUser.mockResolvedValue(null);

    const res = await POST(createRequest(CREATE_BODY));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
  });

  it("생성에 성공하면 201과 변환된 할 일을 반환한다", async () => {
    const res = await POST(createRequest(CREATE_BODY));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      id: "todo-1",
      workspaceId: WORKSPACE_ID,
      title: "청소하기",
      isCompleted: false,
      startDate: "2020-01-01",
      endDate: "2020-01-02",
      createdAt: "2020-01-01T00:00:00.000Z",
    });
  });

  it("DB 에러가 나면 500을 반환한다", async () => {
    mockedCreateServerSupabase.mockResolvedValue(createSupabaseMock({ data: null, error: ERROR }));

    const res = await POST(createRequest(CREATE_BODY));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "할 일 생성에 실패했습니다." });
  });
});

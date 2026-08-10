import { beforeEach, describe, expect, it, vi } from "vitest";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";

import { DELETE, PATCH } from "./route";

import type { NextRequest } from "next/server";
import type { SupabaseClient, PostgrestError } from "@supabase/supabase-js";
import type { User } from "@/types/user";

vi.mock("@/server/common/utils/supabaseClient", () => ({
  createServerSupabase: vi.fn(),
  getSessionUser: vi.fn(),
}));

const TODO_ID = "todo-1"; // 테스트용 할 일 id

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

const TODO_ROW = {
  id: TODO_ID,
  workspace_id: "ws-1",
  title: "청소하기",
  description: undefined,
  is_completed: true,
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

/** `.from().update().eq().select().single()` / `.from().delete().eq().select()` 체이닝을 흉내내는 thenable 빌더를 만든다 */
const createQueryBuilder = (result: QueryResult) => {
  const builder: Record<string, unknown> = {
    then: (resolve: (value: QueryResult) => unknown) => Promise.resolve(result).then(resolve),
  };
  ["select", "eq", "update", "delete", "single"].forEach((method) => {
    builder[method] = () => builder;
  });
  return builder;
};

/** 체이닝 결과를 고정한 Supabase 클라이언트 목을 만든다 */
const createSupabaseMock = (result: QueryResult) =>
  ({ from: vi.fn(() => createQueryBuilder(result)) }) as unknown as SupabaseClient;

/** RouteContext 모양의 컨텍스트를 만든다 */
const createContext = () => ({ params: Promise.resolve({ id: TODO_ID }) });

/** json() 만 사용하는 라우트에 넘길 최소 요청 객체를 만든다 */
const createRequest = (body: unknown) => ({ json: async () => body }) as unknown as NextRequest;

const mockedCreateServerSupabase = vi.mocked(createServerSupabase);
const mockedGetSessionUser = vi.mocked(getSessionUser);

const UPDATE_BODY = { isCompleted: true };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mockedCreateServerSupabase.mockResolvedValue(createSupabaseMock({ data: TODO_ROW }));
  mockedGetSessionUser.mockResolvedValue(SESSION_USER);
});

describe("PATCH /api/todos/[id]", () => {
  it("로그인하지 않았으면 401을 반환한다", async () => {
    mockedGetSessionUser.mockResolvedValue(null);

    const res = await PATCH(createRequest(UPDATE_BODY), createContext());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
  });

  it("수정에 성공하면 200과 변환된 할 일을 반환한다", async () => {
    const res = await PATCH(createRequest(UPDATE_BODY), createContext());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: TODO_ID,
      workspaceId: "ws-1",
      title: "청소하기",
      isCompleted: true,
      startDate: "2020-01-01",
      endDate: "2020-01-02",
      createdAt: "2020-01-01T00:00:00.000Z",
    });
  });

  it("존재하지 않는 id를 수정하려 하면 404를 반환한다", async () => {
    mockedCreateServerSupabase.mockResolvedValue(
      createSupabaseMock({ data: null, error: NOT_FOUND_ERROR })
    );

    const res = await PATCH(createRequest(UPDATE_BODY), createContext());

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "할 일을 찾을 수 없습니다." });
  });

  it("DB 에러가 나면 500을 반환한다", async () => {
    mockedCreateServerSupabase.mockResolvedValue(createSupabaseMock({ data: null, error: ERROR }));

    const res = await PATCH(createRequest(UPDATE_BODY), createContext());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "할 일 수정에 실패했습니다." });
  });
});

describe("DELETE /api/todos/[id]", () => {
  beforeEach(() => {
    mockedCreateServerSupabase.mockResolvedValue(createSupabaseMock({ data: [TODO_ROW] }));
  });

  it("로그인하지 않았으면 401을 반환한다", async () => {
    mockedGetSessionUser.mockResolvedValue(null);

    const res = await DELETE(createRequest(null), createContext());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
  });

  it("삭제에 성공하면 204를 반환한다", async () => {
    const res = await DELETE(createRequest(null), createContext());

    expect(res.status).toBe(204);
  });

  it("삭제된 행이 없으면 404를 반환한다", async () => {
    mockedCreateServerSupabase.mockResolvedValue(createSupabaseMock({ data: [] }));

    const res = await DELETE(createRequest(null), createContext());

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "할 일을 찾을 수 없습니다." });
  });

  it("DB 에러가 나면 500을 반환한다", async () => {
    mockedCreateServerSupabase.mockResolvedValue(createSupabaseMock({ data: null, error: ERROR }));

    const res = await DELETE(createRequest(null), createContext());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "할 일 삭제에 실패했습니다." });
  });
});

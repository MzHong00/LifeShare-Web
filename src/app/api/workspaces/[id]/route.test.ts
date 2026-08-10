import { beforeEach, describe, expect, it, vi } from "vitest";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";

import { PATCH } from "./route";

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

// 마지막 체이닝 결과로 resolve되는 Supabase 쿼리 빌더 목
interface QueryResult {
  data?: unknown;
  error?: PostgrestError | null;
}

/** `.from().update().eq().select()` 체이닝을 흉내내는 thenable 빌더를 만든다 */
const createQueryBuilder = (result: QueryResult) => {
  const builder: Record<string, unknown> = {
    then: (resolve: (value: QueryResult) => unknown) => Promise.resolve(result).then(resolve),
  };
  ["select", "eq", "update"].forEach((method) => {
    builder[method] = () => builder;
  });
  return builder;
};

/** 체이닝 결과를 고정한 Supabase 클라이언트 목을 만든다 */
const createSupabaseMock = (result: QueryResult) =>
  ({ from: vi.fn(() => createQueryBuilder(result)) }) as unknown as SupabaseClient;

/** RouteContext 모양의 컨텍스트를 만든다 */
const createContext = () => ({ params: Promise.resolve({ id: WORKSPACE_ID }) });

/** json() 만 사용하는 라우트에 넘길 최소 요청 객체를 만든다 */
const createRequest = (body: unknown) => ({ json: async () => body }) as unknown as NextRequest;

const mockedCreateServerSupabase = vi.mocked(createServerSupabase);
const mockedGetSessionUser = vi.mocked(getSessionUser);

const BODY = { name: "우리 방", startDate: "2020-01-01", themeColor: "#fff" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mockedCreateServerSupabase.mockResolvedValue(
    createSupabaseMock({ data: [{ id: WORKSPACE_ID }] })
  );
  mockedGetSessionUser.mockResolvedValue(SESSION_USER);
});

describe("PATCH /api/workspaces/[id]", () => {
  it("로그인하지 않았으면 401을 반환한다", async () => {
    mockedGetSessionUser.mockResolvedValue(null);

    const res = await PATCH(createRequest(BODY), createContext());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
  });

  it("시작일이 미래 날짜면 400을 반환한다", async () => {
    const res = await PATCH(createRequest({ ...BODY, startDate: "2999-12-31" }), createContext());

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      message: "함께한 날은 오늘 이후 날짜로 설정할 수 없습니다.",
    });
  });

  it("시작일이 없어도 수정에 성공한다", async () => {
    const res = await PATCH(createRequest({ name: "우리 방" }), createContext());

    expect(res.status).toBe(204);
  });

  it("수정에 성공하면 204를 반환한다", async () => {
    const res = await PATCH(createRequest(BODY), createContext());

    expect(res.status).toBe(204);
  });

  it("매칭되는 워크스페이스가 없으면 404를 반환한다", async () => {
    mockedCreateServerSupabase.mockResolvedValue(createSupabaseMock({ data: [] }));

    const res = await PATCH(createRequest(BODY), createContext());

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "워크스페이스를 찾을 수 없습니다." });
  });

  it("DB 에러가 나면 500을 반환한다", async () => {
    mockedCreateServerSupabase.mockResolvedValue(createSupabaseMock({ data: null, error: ERROR }));

    const res = await PATCH(createRequest(BODY), createContext());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "워크스페이스 수정에 실패했습니다." });
  });
});

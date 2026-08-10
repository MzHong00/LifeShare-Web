import { beforeEach, describe, expect, it, vi } from "vitest";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";
import { workspaceRepository } from "@/server/domain/workspace/repository";

import { DELETE, PATCH } from "./route";

import type { NextRequest } from "next/server";
import type { SupabaseClient, PostgrestError } from "@supabase/supabase-js";
import type { User } from "@/types/user";

vi.mock("@/server/common/utils/supabaseClient", () => ({
  createServerSupabase: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock("@/server/domain/workspace/repository", () => ({
  workspaceRepository: {
    findMemberRole: vi.fn(),
    countMembers: vi.fn(),
    deleteById: vi.fn(),
    transferOwnership: vi.fn(),
  },
}));

const WORKSPACE_ID = "ws-1"; // 테스트용 워크스페이스 id
const USER_ID = "user-1"; // 세션 사용자 id
const OTHER_USER_ID = "user-2"; // 다른 멤버 id

const ERROR_FIELDS = {
  name: "PostgrestError",
  message: "실패",
  details: "",
  hint: "",
  code: "PGRST000",
};
const ERROR: PostgrestError = { ...ERROR_FIELDS, toJSON: () => ERROR_FIELDS };

const SESSION_USER: User = { id: USER_ID, name: "나", email: "me@test.com" };

// 마지막 체이닝 결과로 resolve되는 Supabase 쿼리 빌더 목
interface QueryResult {
  data?: unknown;
  error?: PostgrestError | null;
}

/** `.from().update().eq().eq().select()` 체이닝을 흉내내는 thenable 빌더를 만든다 */
const createQueryBuilder = (result: QueryResult) => {
  const builder: Record<string, unknown> = {
    then: (resolve: (value: QueryResult) => unknown) => Promise.resolve(result).then(resolve),
  };
  ["select", "eq", "update", "delete"].forEach((method) => {
    builder[method] = () => builder;
  });
  return builder;
};

/** 체이닝 결과를 고정한 Supabase 클라이언트 목을 만든다 */
const createSupabaseMock = (result: QueryResult) =>
  ({ from: vi.fn(() => createQueryBuilder(result)) }) as unknown as SupabaseClient;

/** RouteContext 모양의 컨텍스트를 만든다 */
const createContext = (userId: string) => ({
  params: Promise.resolve({ id: WORKSPACE_ID, userId }),
});

/** json() 만 사용하는 라우트에 넘길 최소 요청 객체를 만든다 */
const createRequest = (body: unknown) => ({ json: async () => body }) as unknown as NextRequest;

const mockedCreateServerSupabase = vi.mocked(createServerSupabase);
const mockedGetSessionUser = vi.mocked(getSessionUser);
const mockedRepository = vi.mocked(workspaceRepository);

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mockedCreateServerSupabase.mockResolvedValue(createSupabaseMock({ data: [{ id: 1 }] }));
  mockedGetSessionUser.mockResolvedValue(SESSION_USER);
});

describe("PATCH /api/workspaces/[id]/members/[userId]", () => {
  const BODY = { displayName: "새이름", avatarUrl: "https://img" };

  it("로그인하지 않았으면 401을 반환한다", async () => {
    mockedGetSessionUser.mockResolvedValue(null);

    const res = await PATCH(createRequest(BODY), createContext(USER_ID));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
  });

  it("본인이 아닌 멤버를 수정하려 하면 403을 반환한다", async () => {
    const res = await PATCH(createRequest(BODY), createContext(OTHER_USER_ID));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ message: "본인 프로필만 수정할 수 있습니다." });
  });

  it("본인 프로필 수정에 성공하면 204를 반환한다", async () => {
    const res = await PATCH(createRequest(BODY), createContext(USER_ID));

    expect(res.status).toBe(204);
  });

  it("매칭되는 멤버 행이 없으면 404를 반환한다", async () => {
    mockedCreateServerSupabase.mockResolvedValue(createSupabaseMock({ data: [] }));

    const res = await PATCH(createRequest(BODY), createContext(USER_ID));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "멤버를 찾을 수 없습니다." });
  });

  it("DB 에러가 나면 500을 반환한다", async () => {
    mockedCreateServerSupabase.mockResolvedValue(createSupabaseMock({ data: null, error: ERROR }));

    const res = await PATCH(createRequest(BODY), createContext(USER_ID));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "멤버 프로필 수정에 실패했습니다." });
  });
});

describe("DELETE /api/workspaces/[id]/members/[userId]", () => {
  beforeEach(() => {
    mockedRepository.countMembers.mockResolvedValue({ count: 2, error: null });
    mockedRepository.transferOwnership.mockResolvedValue(null);
    mockedRepository.deleteById.mockResolvedValue({ isDeleted: true, error: null });
  });

  it("로그인하지 않았으면 401을 반환한다", async () => {
    mockedGetSessionUser.mockResolvedValue(null);

    const res = await DELETE(createRequest(null), createContext(USER_ID));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
  });

  it("타인을 제거하려는 요청자가 방장이 아니면 403을 반환한다", async () => {
    mockedRepository.findMemberRole.mockResolvedValue("member");

    const res = await DELETE(createRequest(null), createContext(OTHER_USER_ID));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      message: "멤버 내보내기는 라이프룸을 만든 사람만 할 수 있습니다.",
    });
  });

  it("타인 제거 시 대상 멤버가 없으면 404를 반환한다", async () => {
    mockedRepository.findMemberRole
      .mockResolvedValueOnce("owner") // 요청자
      .mockResolvedValueOnce(null); // 대상

    const res = await DELETE(createRequest(null), createContext(OTHER_USER_ID));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "멤버를 찾을 수 없습니다." });
  });

  it("제거 대상이 방장이면 403을 반환한다", async () => {
    mockedRepository.findMemberRole.mockResolvedValue("owner");

    const res = await DELETE(createRequest(null), createContext(OTHER_USER_ID));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ message: "라이프룸을 만든 사람은 내보낼 수 없습니다." });
  });

  it("방장이 일반 멤버를 강퇴하면 204를 반환하고 방장 위임은 하지 않는다", async () => {
    mockedRepository.findMemberRole
      .mockResolvedValueOnce("owner") // 요청자
      .mockResolvedValueOnce("member"); // 대상

    const res = await DELETE(createRequest(null), createContext(OTHER_USER_ID));

    expect(res.status).toBe(204);
    expect(mockedRepository.transferOwnership).not.toHaveBeenCalled();
  });

  it("멤버 수 조회에 실패하면 500을 반환한다", async () => {
    mockedRepository.countMembers.mockResolvedValue({ count: null, error: ERROR });

    const res = await DELETE(createRequest(null), createContext(USER_ID));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "멤버 제거에 실패했습니다." });
  });

  it("마지막 멤버가 나가면 워크스페이스 전체를 삭제하고 204를 반환한다", async () => {
    mockedRepository.countMembers.mockResolvedValue({ count: 1, error: null });

    const res = await DELETE(createRequest(null), createContext(USER_ID));

    expect(res.status).toBe(204);
    expect(mockedRepository.deleteById).toHaveBeenCalledWith(expect.anything(), WORKSPACE_ID);
    expect(mockedRepository.transferOwnership).not.toHaveBeenCalled();
  });

  it("마지막 멤버 나가기 중 워크스페이스 삭제 에러가 나면 500을 반환한다", async () => {
    mockedRepository.countMembers.mockResolvedValue({ count: 1, error: null });
    mockedRepository.deleteById.mockResolvedValue({ isDeleted: false, error: ERROR });

    const res = await DELETE(createRequest(null), createContext(USER_ID));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "워크스페이스 나가기에 실패했습니다." });
  });

  it("마지막 멤버 나가기 시 삭제가 반영되지 않으면 500을 반환한다", async () => {
    mockedRepository.countMembers.mockResolvedValue({ count: 1, error: null });
    mockedRepository.deleteById.mockResolvedValue({ isDeleted: false, error: null });

    const res = await DELETE(createRequest(null), createContext(USER_ID));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "워크스페이스 나가기에 실패했습니다." });
  });

  it("본인이 나갈 때 방장 위임을 먼저 호출하고 204를 반환한다", async () => {
    const res = await DELETE(createRequest(null), createContext(USER_ID));

    expect(mockedRepository.transferOwnership).toHaveBeenCalledWith(
      expect.anything(),
      WORKSPACE_ID
    );
    expect(res.status).toBe(204);
  });

  it("방장 위임에 실패하면 500을 반환하고 멤버 삭제를 진행하지 않는다", async () => {
    mockedRepository.transferOwnership.mockResolvedValue(ERROR);
    const supabase = createSupabaseMock({ data: [{ id: 1 }] });
    mockedCreateServerSupabase.mockResolvedValue(supabase);

    const res = await DELETE(createRequest(null), createContext(USER_ID));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "멤버 제거에 실패했습니다." });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("멤버 삭제 중 DB 에러가 나면 500을 반환한다", async () => {
    mockedCreateServerSupabase.mockResolvedValue(createSupabaseMock({ data: null, error: ERROR }));

    const res = await DELETE(createRequest(null), createContext(USER_ID));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "멤버 제거에 실패했습니다." });
  });

  it("삭제된 멤버 행이 없으면 404를 반환한다", async () => {
    mockedCreateServerSupabase.mockResolvedValue(createSupabaseMock({ data: [] }));

    const res = await DELETE(createRequest(null), createContext(USER_ID));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "멤버를 찾을 수 없습니다." });
  });
});

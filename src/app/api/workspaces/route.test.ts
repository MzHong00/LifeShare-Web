import { beforeEach, describe, expect, it, vi } from "vitest";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";
import { workspaceRepository } from "@/server/domain/workspace/repository";

import { GET, POST } from "./route";

import type { NextRequest } from "next/server";
import type { SupabaseClient, PostgrestError } from "@supabase/supabase-js";
import type { User } from "@/types/user";
import type { Workspace } from "@/features/workspace/types/workspace";

vi.mock("@/server/common/utils/supabaseClient", () => ({
  createServerSupabase: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock("@/server/domain/workspace/repository", () => ({
  workspaceRepository: {
    findManyByUserId: vi.fn(),
    create: vi.fn(),
    insertMember: vi.fn(),
    findById: vi.fn(),
  },
}));

const ERROR_FIELDS = {
  name: "PostgrestError",
  message: "실패",
  details: "",
  hint: "",
  code: "PGRST000",
};
const ERROR: PostgrestError = { ...ERROR_FIELDS, toJSON: () => ERROR_FIELDS };

const SESSION_USER: User = { id: "user-1", name: "나", email: "me@test.com" };

const PROFILE = { name: "홍길동", avatar_url: "https://example.com/a.png" };

const WORKSPACE_ID = "ws-1"; // 테스트용 워크스페이스 id

const WORKSPACE = {
  id: WORKSPACE_ID,
  name: "우리집",
  type: "couple",
  members: [],
} as unknown as Workspace;

/** profiles 조회만 지원하는 가짜 Supabase 클라이언트를 만든다 */
const createSupabase = (profile: typeof PROFILE | null) => {
  const builder = {
    select: () => builder,
    eq: () => builder,
    maybeSingle: () => Promise.resolve({ data: profile, error: null }),
  };
  return { from: vi.fn(() => builder) } as unknown as SupabaseClient;
};

/** json() 만 사용하는 라우트에 넘길 최소 요청 객체를 만든다 */
const createRequest = (body: unknown) => ({ json: async () => body }) as unknown as NextRequest;

const mockedCreateServerSupabase = vi.mocked(createServerSupabase);
const mockedGetSessionUser = vi.mocked(getSessionUser);
const mockedRepository = vi.mocked(workspaceRepository);

const BODY = { name: "우리집", type: "couple", startDate: "2020-01-01" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mockedCreateServerSupabase.mockResolvedValue(createSupabase(PROFILE));
  mockedGetSessionUser.mockResolvedValue(SESSION_USER);
});

describe("GET /api/workspaces", () => {
  it("로그인하지 않았으면 401을 반환한다", async () => {
    mockedGetSessionUser.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
  });

  it("조회에 성공하면 워크스페이스 목록을 반환한다", async () => {
    mockedRepository.findManyByUserId.mockResolvedValue({ data: [WORKSPACE], error: null });

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([WORKSPACE]);
    expect(mockedRepository.findManyByUserId).toHaveBeenCalledWith(expect.anything(), "user-1");
  });

  it("DB 에러가 나면 500을 반환한다", async () => {
    mockedRepository.findManyByUserId.mockResolvedValue({ data: [], error: ERROR });

    const res = await GET();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "워크스페이스 목록 조회에 실패했습니다." });
  });
});

describe("POST /api/workspaces", () => {
  beforeEach(() => {
    mockedRepository.create.mockResolvedValue({
      data: { id: WORKSPACE_ID },
      error: null,
    } as unknown as Awaited<ReturnType<typeof workspaceRepository.create>>);
    mockedRepository.insertMember.mockResolvedValue({
      error: null,
    } as unknown as Awaited<ReturnType<typeof workspaceRepository.insertMember>>);
    mockedRepository.findById.mockResolvedValue({ data: WORKSPACE, error: null });
  });

  it("name이 없으면 400을 반환한다", async () => {
    const res = await POST(createRequest({ type: "couple" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "name, type은 필수입니다." });
    expect(mockedGetSessionUser).not.toHaveBeenCalled();
  });

  it("type이 없으면 400을 반환한다", async () => {
    const res = await POST(createRequest({ name: "우리집" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "name, type은 필수입니다." });
  });

  it("로그인하지 않았으면 401을 반환한다", async () => {
    mockedGetSessionUser.mockResolvedValue(null);

    const res = await POST(createRequest(BODY));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
  });

  it("워크스페이스 생성에 실패하면 500을 반환한다", async () => {
    mockedRepository.create.mockResolvedValue({
      data: null,
      error: ERROR,
    } as unknown as Awaited<ReturnType<typeof workspaceRepository.create>>);

    const res = await POST(createRequest(BODY));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "워크스페이스 생성에 실패했습니다." });
    expect(mockedRepository.insertMember).not.toHaveBeenCalled();
  });

  it("생성자를 owner 멤버로 등록하는 데 실패하면 500을 반환한다", async () => {
    mockedRepository.insertMember.mockResolvedValue({
      error: ERROR,
    } as unknown as Awaited<ReturnType<typeof workspaceRepository.insertMember>>);

    const res = await POST(createRequest(BODY));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "워크스페이스 생성에 실패했습니다." });
    expect(mockedRepository.insertMember).toHaveBeenCalledWith(expect.anything(), WORKSPACE_ID, {
      userId: "user-1",
      name: PROFILE.name,
      email: "me@test.com",
      avatarUrl: PROFILE.avatar_url,
      role: "owner",
    });
  });

  it("생성 후 재조회에 실패하면 500을 반환한다", async () => {
    mockedRepository.findById.mockResolvedValue({ data: null, error: ERROR });

    const res = await POST(createRequest(BODY));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "워크스페이스 생성에 실패했습니다." });
  });

  it("생성에 성공하면 201과 워크스페이스를 반환한다", async () => {
    const res = await POST(createRequest(BODY));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ workspace: WORKSPACE });
  });

  it("프로필이 없어도 이름·사진을 undefined로 넘겨 멤버를 등록한다", async () => {
    mockedCreateServerSupabase.mockResolvedValue(createSupabase(null));

    const res = await POST(createRequest(BODY));

    expect(res.status).toBe(201);
    expect(mockedRepository.insertMember).toHaveBeenCalledWith(expect.anything(), WORKSPACE_ID, {
      userId: "user-1",
      name: undefined,
      email: "me@test.com",
      avatarUrl: undefined,
      role: "owner",
    });
  });
});

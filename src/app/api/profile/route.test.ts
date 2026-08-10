import { beforeEach, describe, expect, it, vi } from "vitest";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";
import { profileRepository } from "@/server/domain/profile/repository";
import { workspaceRepository } from "@/server/domain/workspace/repository";

import { GET, PATCH, POST } from "./route";

import type { NextRequest } from "next/server";
import type { PostgrestError } from "@supabase/supabase-js";
import type { User } from "@/types/user";

vi.mock("@/server/common/utils/supabaseClient", () => ({
  createServerSupabase: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock("@/server/domain/profile/repository", () => ({
  profileRepository: {
    findById: vi.fn(),
    createIfNotExists: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/server/domain/workspace/repository", () => ({
  workspaceRepository: {
    updateMemberProfile: vi.fn(),
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

const SESSION_USER: User = {
  id: "user-1",
  name: "구글이름",
  email: "me@test.com",
  profileImage: "https://google.com/a.png",
};

/** json() 만 사용하는 라우트에 넘길 최소 요청 객체를 만든다 */
const createRequest = (body: unknown) => ({ json: async () => body }) as unknown as NextRequest;

const mockedCreateServerSupabase = vi.mocked(createServerSupabase);
const mockedGetSessionUser = vi.mocked(getSessionUser);
const mockedProfileRepository = vi.mocked(profileRepository);
const mockedWorkspaceRepository = vi.mocked(workspaceRepository);

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mockedCreateServerSupabase.mockResolvedValue(
    {} as unknown as ReturnType<typeof createServerSupabase> extends Promise<infer T> ? T : never
  );
  mockedGetSessionUser.mockResolvedValue(SESSION_USER);
});

describe("GET /api/profile", () => {
  it("로그인하지 않았으면 401을 반환한다", async () => {
    mockedGetSessionUser.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
  });

  it("프로필이 있으면 이름·사진을 포함해 반환한다", async () => {
    mockedProfileRepository.findById.mockResolvedValue({
      data: { name: "홍길동", avatar_url: "https://example.com/a.png" },
      error: null,
    } as unknown as Awaited<ReturnType<typeof profileRepository.findById>>);

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: "user-1",
      name: "홍길동",
      email: "me@test.com",
      profileImage: "https://example.com/a.png",
    });
  });

  it("프로필이 없으면 이름은 빈 문자열로 반환한다", async () => {
    mockedProfileRepository.findById.mockResolvedValue({
      data: null,
      error: null,
    } as unknown as Awaited<ReturnType<typeof profileRepository.findById>>);

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: "user-1",
      name: "",
      email: "me@test.com",
      profileImage: undefined,
    });
  });
});

describe("POST /api/profile", () => {
  it("로그인하지 않았으면 401을 반환한다", async () => {
    mockedGetSessionUser.mockResolvedValue(null);

    const res = await POST();

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
  });

  it("구글 메타데이터로 프로필 생성에 성공하면 204를 반환한다", async () => {
    mockedProfileRepository.createIfNotExists.mockResolvedValue({
      error: null,
    } as unknown as Awaited<ReturnType<typeof profileRepository.createIfNotExists>>);

    const res = await POST();

    expect(res.status).toBe(204);
    expect(mockedProfileRepository.createIfNotExists).toHaveBeenCalledWith(
      expect.anything(),
      "user-1",
      { name: "구글이름", avatarUrl: "https://google.com/a.png" }
    );
  });

  it("프로필 생성에 실패하면 500을 반환한다", async () => {
    mockedProfileRepository.createIfNotExists.mockResolvedValue({
      error: ERROR,
    } as unknown as Awaited<ReturnType<typeof profileRepository.createIfNotExists>>);

    const res = await POST();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "프로필 생성에 실패했습니다." });
  });
});

describe("PATCH /api/profile", () => {
  const BODY = { name: "새이름", profileImage: "https://example.com/new.png" };

  beforeEach(() => {
    mockedProfileRepository.update.mockResolvedValue({ error: null } as unknown as Awaited<
      ReturnType<typeof profileRepository.update>
    >);
    mockedWorkspaceRepository.updateMemberProfile.mockResolvedValue({
      error: null,
    } as unknown as Awaited<ReturnType<typeof workspaceRepository.updateMemberProfile>>);
  });

  it("로그인하지 않았으면 401을 반환한다", async () => {
    mockedGetSessionUser.mockResolvedValue(null);

    const res = await PATCH(createRequest(BODY));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
  });

  it("프로필 수정에 실패하면 500을 반환한다", async () => {
    mockedProfileRepository.update.mockResolvedValue({ error: ERROR } as unknown as Awaited<
      ReturnType<typeof profileRepository.update>
    >);

    const res = await PATCH(createRequest(BODY));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "프로필 수정에 실패했습니다." });
    expect(mockedWorkspaceRepository.updateMemberProfile).not.toHaveBeenCalled();
  });

  it("라이프룸 멤버 정보 동기화에 실패하면 500을 반환한다", async () => {
    mockedWorkspaceRepository.updateMemberProfile.mockResolvedValue({
      error: ERROR,
    } as unknown as Awaited<ReturnType<typeof workspaceRepository.updateMemberProfile>>);

    const res = await PATCH(createRequest(BODY));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "라이프룸 멤버 정보 동기화에 실패했습니다." });
  });

  it("수정에 성공하면 204를 반환하고 프로필·멤버 정보를 함께 갱신한다", async () => {
    const res = await PATCH(createRequest(BODY));

    expect(res.status).toBe(204);
    expect(mockedProfileRepository.update).toHaveBeenCalledWith(expect.anything(), "user-1", {
      name: "새이름",
      avatarUrl: "https://example.com/new.png",
    });
    expect(mockedWorkspaceRepository.updateMemberProfile).toHaveBeenCalledWith(
      expect.anything(),
      "user-1",
      { name: "새이름", avatarUrl: "https://example.com/new.png" }
    );
  });
});

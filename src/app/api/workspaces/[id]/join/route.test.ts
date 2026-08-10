import { describe, expect, it, vi, beforeEach } from "vitest";

import { POST } from "@/app/api/workspaces/[id]/join/route";
import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";
import { workspaceRepository } from "@/server/domain/workspace/repository";

import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@/types/user";
import type { Workspace } from "@/features/workspace/types/workspace";

vi.mock("@/server/common/utils/supabaseClient", () => ({
  createServerSupabase: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock("@/server/domain/workspace/repository", () => ({
  workspaceRepository: {
    joinByInviteCode: vi.fn(),
    findById: vi.fn(),
  },
}));

const WORKSPACE_ID = "workspace-1";
const USER_ID = "user-1";
const USER_EMAIL = "a@b.c";
const INVITE_CODE = "K7M2P9QX";

const PROFILE = { name: "홍길동", avatar_url: "https://example.com/a.png" };

const WORKSPACE = {
  id: WORKSPACE_ID,
  name: "우리집",
  type: "couple",
  members: [],
} as unknown as Workspace;

let supabase: SupabaseClient;

/** profiles 조회만 지원하는 가짜 Supabase 클라이언트를 만든다 */
const createSupabase = (profile: typeof PROFILE | null) => {
  const builder = {
    select: () => builder,
    eq: () => builder,
    maybeSingle: () => Promise.resolve({ data: profile, error: null }),
  };
  return { from: vi.fn(() => builder) } as unknown as SupabaseClient;
};

/** 참여 요청을 만든다 (body는 json()으로만 소비된다) */
const createRequest = (body: unknown) => ({ json: async () => body }) as unknown as NextRequest;

const context = () => ({ params: Promise.resolve({ id: WORKSPACE_ID }) });

/** 세션 사용자를 로그인 상태로 만든다 */
const mockSessionUser = () =>
  vi
    .mocked(getSessionUser)
    .mockResolvedValue({ id: USER_ID, email: USER_EMAIL } as unknown as User);

beforeEach(() => {
  vi.clearAllMocks();
  supabase = createSupabase(PROFILE);
  vi.mocked(createServerSupabase).mockResolvedValue(supabase);
});

describe("POST /api/workspaces/[id]/join", () => {
  it("로그인하지 않으면 401을 반환한다", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const res = await POST(createRequest({ inviteCode: INVITE_CODE }), context());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
    expect(workspaceRepository.joinByInviteCode).not.toHaveBeenCalled();
  });

  it("초대 코드가 없으면 400을 반환한다", async () => {
    mockSessionUser();

    const res = await POST(createRequest({}), context());

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "유효하지 않은 초대 코드입니다." });
    expect(workspaceRepository.joinByInviteCode).not.toHaveBeenCalled();
  });

  it("초대 코드 형식이 틀리면 400을 반환한다", async () => {
    mockSessionUser();

    const res = await POST(createRequest({ inviteCode: "ABC" }), context());

    expect(res.status).toBe(400);
    expect(workspaceRepository.joinByInviteCode).not.toHaveBeenCalled();
  });

  it("소문자·하이픈이 섞인 코드도 정규화해 처리한다", async () => {
    mockSessionUser();
    vi.mocked(workspaceRepository.joinByInviteCode).mockResolvedValue({
      workspaceId: WORKSPACE_ID,
      error: null,
    });
    vi.mocked(workspaceRepository.findById).mockResolvedValue({
      data: WORKSPACE,
      error: null,
    });

    const res = await POST(createRequest({ inviteCode: "k7m2-p9qx" }), context());

    expect(res.status).toBe(200);
    expect(workspaceRepository.joinByInviteCode).toHaveBeenCalledWith(supabase, INVITE_CODE, {
      name: PROFILE.name,
      email: USER_EMAIL,
      avatarUrl: PROFILE.avatar_url,
    });
  });

  it("참여에 실패하면 403을 반환한다", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSessionUser();
    vi.mocked(workspaceRepository.joinByInviteCode).mockResolvedValue({
      workspaceId: null,
      error: null,
    });

    const res = await POST(createRequest({ inviteCode: INVITE_CODE }), context());

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ message: "유효하지 않은 초대 코드입니다." });
    expect(workspaceRepository.findById).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("코드가 다른 라이프룸을 가리키면 403을 반환한다", async () => {
    mockSessionUser();
    vi.mocked(workspaceRepository.joinByInviteCode).mockResolvedValue({
      workspaceId: "workspace-2",
      error: null,
    });

    const res = await POST(createRequest({ inviteCode: INVITE_CODE }), context());

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ message: "유효하지 않은 초대 코드입니다." });
    expect(workspaceRepository.findById).not.toHaveBeenCalled();
  });

  it("참여에 성공하면 워크스페이스를 반환한다", async () => {
    mockSessionUser();
    vi.mocked(workspaceRepository.joinByInviteCode).mockResolvedValue({
      workspaceId: WORKSPACE_ID,
      error: null,
    });
    vi.mocked(workspaceRepository.findById).mockResolvedValue({
      data: WORKSPACE,
      error: null,
    });

    const res = await POST(createRequest({ inviteCode: INVITE_CODE }), context());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(WORKSPACE);
    expect(workspaceRepository.findById).toHaveBeenCalledWith(supabase, WORKSPACE_ID);
  });

  it("프로필이 없어도 이름·사진을 undefined로 넘겨 참여한다", async () => {
    mockSessionUser();
    supabase = createSupabase(null);
    vi.mocked(createServerSupabase).mockResolvedValue(supabase);
    vi.mocked(workspaceRepository.joinByInviteCode).mockResolvedValue({
      workspaceId: WORKSPACE_ID,
      error: null,
    });
    vi.mocked(workspaceRepository.findById).mockResolvedValue({
      data: WORKSPACE,
      error: null,
    });

    const res = await POST(createRequest({ inviteCode: INVITE_CODE }), context());

    expect(res.status).toBe(200);
    expect(workspaceRepository.joinByInviteCode).toHaveBeenCalledWith(supabase, INVITE_CODE, {
      name: undefined,
      email: USER_EMAIL,
      avatarUrl: undefined,
    });
  });

  it("참여 후 워크스페이스 조회에 실패하면 404를 반환한다", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSessionUser();
    vi.mocked(workspaceRepository.joinByInviteCode).mockResolvedValue({
      workspaceId: WORKSPACE_ID,
      error: null,
    });
    vi.mocked(workspaceRepository.findById).mockResolvedValue({ data: null, error: null });

    const res = await POST(createRequest({ inviteCode: INVITE_CODE }), context());

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "워크스페이스를 찾을 수 없습니다." });
    errorSpy.mockRestore();
  });
});

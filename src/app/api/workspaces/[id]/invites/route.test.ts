import { describe, expect, it, vi, beforeEach } from "vitest";

import { GET, POST } from "@/app/api/workspaces/[id]/invites/route";
import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";
import { workspaceRepository } from "@/server/domain/workspace/repository";

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
    findInviteByWorkspaceId: vi.fn(),
    upsertInvite: vi.fn(),
  },
}));

const WORKSPACE_ID = "workspace-1";
const USER_ID = "user-1";
const INVITE_CODE_PATTERN = /^[0-9A-HJKMNP-TV-Z]{8}$/; // 발급 코드 형식 (Crockford Base32 8자리)

/** PostgrestError 모양의 가짜 에러를 만든다 */
const createError = (code: string): PostgrestError => {
  const fields = { name: "PostgrestError", message: "실패", details: "", hint: "", code };
  return { ...fields, toJSON: () => fields };
};

const UNIQUE_VIOLATION = createError("23505");
const OTHER_ERROR = createError("PGRST000");

const supabase = {} as unknown as SupabaseClient;
const context = { params: Promise.resolve({ id: WORKSPACE_ID }) };
const request = {} as unknown as NextRequest;

/** 세션 사용자를 로그인 상태로 만든다 */
const mockSessionUser = () =>
  vi.mocked(getSessionUser).mockResolvedValue({ id: USER_ID } as unknown as User);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createServerSupabase).mockResolvedValue(supabase);
});

describe("GET /api/workspaces/[id]/invites", () => {
  it("로그인하지 않으면 401을 반환한다", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const res = await GET(request, context);

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
    expect(workspaceRepository.findInviteByWorkspaceId).not.toHaveBeenCalled();
  });

  it("멤버가 아니면 403을 반환한다", async () => {
    mockSessionUser();
    vi.mocked(workspaceRepository.findMemberRole).mockResolvedValue(null);

    const res = await GET(request, context);

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ message: "참여 중인 라이프룸이 아닙니다." });
    expect(workspaceRepository.findInviteByWorkspaceId).not.toHaveBeenCalled();
  });

  it("멤버면 현재 초대 코드를 반환한다", async () => {
    mockSessionUser();
    vi.mocked(workspaceRepository.findMemberRole).mockResolvedValue("member");
    vi.mocked(workspaceRepository.findInviteByWorkspaceId).mockResolvedValue("K7M2P9QX");

    const res = await GET(request, context);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ code: "K7M2P9QX" });
    expect(workspaceRepository.findInviteByWorkspaceId).toHaveBeenCalledWith(
      supabase,
      WORKSPACE_ID
    );
  });

  it("코드가 아직 발급되지 않았으면 code가 null이다", async () => {
    mockSessionUser();
    vi.mocked(workspaceRepository.findMemberRole).mockResolvedValue("owner");
    vi.mocked(workspaceRepository.findInviteByWorkspaceId).mockResolvedValue(null);

    const res = await GET(request, context);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ code: null });
  });
});

describe("POST /api/workspaces/[id]/invites", () => {
  it("로그인하지 않으면 401을 반환한다", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const res = await POST(request, context);

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
    expect(workspaceRepository.upsertInvite).not.toHaveBeenCalled();
  });

  it("일반 멤버면 403을 반환하고 코드를 발급하지 않는다", async () => {
    mockSessionUser();
    vi.mocked(workspaceRepository.findMemberRole).mockResolvedValue("member");

    const res = await POST(request, context);

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      message: "초대 코드는 라이프룸을 만든 사람만 발급할 수 있습니다.",
    });
    expect(workspaceRepository.upsertInvite).not.toHaveBeenCalled();
  });

  it("멤버가 아니면 403을 반환한다", async () => {
    mockSessionUser();
    vi.mocked(workspaceRepository.findMemberRole).mockResolvedValue(null);

    const res = await POST(request, context);

    expect(res.status).toBe(403);
    expect(workspaceRepository.upsertInvite).not.toHaveBeenCalled();
  });

  it("방장이면 201과 새로 발급한 코드를 반환한다", async () => {
    mockSessionUser();
    vi.mocked(workspaceRepository.findMemberRole).mockResolvedValue("owner");
    vi.mocked(workspaceRepository.upsertInvite).mockResolvedValue({
      error: null,
    } as unknown as Awaited<ReturnType<typeof workspaceRepository.upsertInvite>>);

    const res = await POST(request, context);
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(201);
    expect(body.code).toMatch(INVITE_CODE_PATTERN);
    expect(workspaceRepository.upsertInvite).toHaveBeenCalledTimes(1);
    expect(workspaceRepository.upsertInvite).toHaveBeenCalledWith(
      supabase,
      WORKSPACE_ID,
      body.code,
      USER_ID
    );
  });

  it("코드가 충돌하면 새 코드로 재시도해 발급에 성공한다", async () => {
    mockSessionUser();
    vi.mocked(workspaceRepository.findMemberRole).mockResolvedValue("owner");
    vi.mocked(workspaceRepository.upsertInvite)
      .mockResolvedValueOnce({ error: UNIQUE_VIOLATION } as unknown as Awaited<
        ReturnType<typeof workspaceRepository.upsertInvite>
      >)
      .mockResolvedValueOnce({ error: null } as unknown as Awaited<
        ReturnType<typeof workspaceRepository.upsertInvite>
      >);

    const res = await POST(request, context);
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(201);
    expect(body.code).toMatch(INVITE_CODE_PATTERN);
    expect(workspaceRepository.upsertInvite).toHaveBeenCalledTimes(2);

    const [firstCall, secondCall] = vi.mocked(workspaceRepository.upsertInvite).mock.calls;
    expect(firstCall[2]).not.toBe(secondCall[2]); // 재시도 시 새 코드를 만들어야 한다
    expect(secondCall[2]).toBe(body.code);
  });

  it("재시도 한도를 넘기면 500을 반환한다", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSessionUser();
    vi.mocked(workspaceRepository.findMemberRole).mockResolvedValue("owner");
    vi.mocked(workspaceRepository.upsertInvite).mockResolvedValue({
      error: UNIQUE_VIOLATION,
    } as unknown as Awaited<ReturnType<typeof workspaceRepository.upsertInvite>>);

    const res = await POST(request, context);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "초대 코드 생성에 실패했습니다." });
    expect(workspaceRepository.upsertInvite).toHaveBeenCalledTimes(5);
    errorSpy.mockRestore();
  });

  it("충돌이 아닌 DB 에러는 재시도하지 않고 500을 반환한다", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSessionUser();
    vi.mocked(workspaceRepository.findMemberRole).mockResolvedValue("owner");
    vi.mocked(workspaceRepository.upsertInvite).mockResolvedValue({
      error: OTHER_ERROR,
    } as unknown as Awaited<ReturnType<typeof workspaceRepository.upsertInvite>>);

    const res = await POST(request, context);

    expect(res.status).toBe(500);
    expect(workspaceRepository.upsertInvite).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });
});

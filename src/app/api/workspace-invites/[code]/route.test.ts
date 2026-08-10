import { describe, expect, it, vi, beforeEach } from "vitest";

import { GET } from "@/app/api/workspace-invites/[code]/route";
import { createServerSupabase } from "@/server/common/utils/supabaseClient";
import { workspaceRepository } from "@/server/domain/workspace/repository";

import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("@/server/common/utils/supabaseClient", () => ({
  createServerSupabase: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock("@/server/domain/workspace/repository", () => ({
  workspaceRepository: { findInvitePreviewByCode: vi.fn() },
}));

const INVITE_CODE = "K7M2P9QX";
const PREVIEW = { id: "workspace-1", name: "우리집", type: "couple", memberCount: 2 } as const;

const supabase = {} as unknown as SupabaseClient;
const request = {} as unknown as NextRequest;
const context = (code: string) => ({ params: Promise.resolve({ code }) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createServerSupabase).mockResolvedValue(supabase);
});

describe("GET /api/workspace-invites/[code]", () => {
  it("형식이 틀린 코드면 404를 반환하고 조회하지 않는다", async () => {
    const res = await GET(request, context("ABC"));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "유효하지 않은 초대 코드입니다." });
    expect(workspaceRepository.findInvitePreviewByCode).not.toHaveBeenCalled();
  });

  it("존재하지 않는 코드면 404를 반환한다", async () => {
    vi.mocked(workspaceRepository.findInvitePreviewByCode).mockResolvedValue(null);

    const res = await GET(request, context(INVITE_CODE));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "유효하지 않은 초대 코드입니다." });
  });

  it("유효한 코드면 라이프룸 미리보기를 반환한다", async () => {
    vi.mocked(workspaceRepository.findInvitePreviewByCode).mockResolvedValue({ ...PREVIEW });

    const res = await GET(request, context(INVITE_CODE));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(PREVIEW);
    expect(workspaceRepository.findInvitePreviewByCode).toHaveBeenCalledWith(supabase, INVITE_CODE);
  });

  it("소문자·하이픈이 섞인 코드도 정규화해 조회한다", async () => {
    vi.mocked(workspaceRepository.findInvitePreviewByCode).mockResolvedValue({ ...PREVIEW });

    const res = await GET(request, context("k7m2-p9qx"));

    expect(res.status).toBe(200);
    expect(workspaceRepository.findInvitePreviewByCode).toHaveBeenCalledWith(supabase, INVITE_CODE);
  });
});

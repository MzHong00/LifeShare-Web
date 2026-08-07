import { NextResponse } from "next/server";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";
import { POSTGREST_ERROR_CODES } from "@/server/common/constants/codes";
import { workspaceRepository } from "@/server/domain/workspace/repository";
import { generateInviteCode } from "@/features/workspace/utils/inviteCode";

import type { NextRequest } from "next/server";
import type { SupabaseClient, PostgrestError } from "@supabase/supabase-js";
import type { RouteContext } from "@/server/common/types/routeContext";
import type { InviteCodeResponseDto } from "@/server/domain/workspace/dto";

const INVITE_CODE_MAX_ATTEMPTS = 5; // 코드 충돌 시 재생성 시도 횟수

/**
 * 새 초대 코드를 발급한다. invite_code에 unique 제약이 있어 다른 라이프룸의 코드와 겹치면
 * 실패하므로, 그 경우에만 새 코드로 다시 시도한다. 다른 에러는 즉시 반환한다.
 */
const issueInviteCode = async (
  supabase: SupabaseClient,
  workspaceId: string,
  createdBy: string,
  remainingAttempts: number
): Promise<{ code: string | null; error: PostgrestError | null }> => {
  const code = generateInviteCode();
  const { error } = await workspaceRepository.upsertInvite(supabase, workspaceId, code, createdBy);

  if (!error) return { code, error: null };
  if (error.code !== POSTGREST_ERROR_CODES.UNIQUE_VIOLATION || remainingAttempts <= 1)
    return { code: null, error };

  return issueInviteCode(supabase, workspaceId, createdBy, remainingAttempts - 1);
};

/** GET /api/workspaces/[id]/invites — 현재 초대 코드 조회 (멤버만 가능, 미발급이면 code가 null) */
export async function GET(_request: NextRequest, context: RouteContext<{ id: string }>) {
  const { id: workspaceId } = await context.params;

  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const role = await workspaceRepository.findMemberRole(supabase, workspaceId, sessionUser.id);
  if (!role)
    return NextResponse.json({ message: "참여 중인 라이프룸이 아닙니다." }, { status: 403 });

  const code = await workspaceRepository.findInviteByWorkspaceId(supabase, workspaceId);
  return NextResponse.json({ code } satisfies InviteCodeResponseDto);
}

/**
 * POST /api/workspaces/[id]/invites — 초대 코드 발급/재발급 (owner만 가능)
 *
 * 워크스페이스당 코드는 항상 1개다. 재호출하면 새 코드로 교체되고 이전 코드는 즉시 무효가 되며,
 * 이것이 잘못 공유한 코드를 회수하는 유일한 수단이다.
 */
export async function POST(_request: NextRequest, context: RouteContext<{ id: string }>) {
  const { id: workspaceId } = await context.params;

  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const role = await workspaceRepository.findMemberRole(supabase, workspaceId, sessionUser.id);
  if (role !== "owner")
    return NextResponse.json(
      { message: "초대 코드는 라이프룸을 만든 사람만 발급할 수 있습니다." },
      { status: 403 }
    );

  const { code, error } = await issueInviteCode(
    supabase,
    workspaceId,
    sessionUser.id,
    INVITE_CODE_MAX_ATTEMPTS
  );
  if (error || !code) {
    console.error("[api] 초대 코드 생성 실패", error);
    return NextResponse.json({ message: "초대 코드 생성에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ code } satisfies InviteCodeResponseDto, { status: 201 });
}

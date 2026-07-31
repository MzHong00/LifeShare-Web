import { NextResponse } from "next/server";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";

import type { NextRequest } from "next/server";
import type { RouteContext } from "@/server/common/types/routeContext";
import type { InviteCodeCreateResponseDto } from "@/server/domain/workspace/dto";

const INVITE_CODE_LENGTH = 8; // 초대 코드 길이
const INVITE_CODE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 초대 코드 유효 기간 (7일)

/** POST /api/workspaces/[id]/invites — 초대 코드 생성 (발급자는 세션 사용자로 확정) */
export async function POST(_request: NextRequest, context: RouteContext<{ id: string }>) {
  const { id: workspaceId } = await context.params;

  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const code = crypto.randomUUID().replace(/-/g, "").slice(0, INVITE_CODE_LENGTH);
  const expiresAt = new Date(Date.now() + INVITE_CODE_TTL_MS).toISOString();

  const { error } = await supabase.from("workspace_invites").insert({
    workspace_id: workspaceId,
    invite_code: code,
    created_by: sessionUser.id,
    expires_at: expiresAt,
  });
  if (error) {
    console.error("[api] 초대 코드 생성 실패", error);
    return NextResponse.json({ message: "초대 코드 생성에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ code } satisfies InviteCodeCreateResponseDto, { status: 201 });
}

import { NextResponse } from "next/server";

import { createServerSupabase } from "@/server/common/utils/supabaseClient";
import { workspaceRepository } from "@/server/domain/workspace/repository";
import {
  normalizeInviteCode,
  isValidInviteCodeFormat,
} from "@/features/workspace/utils/inviteCode";

import type { NextRequest } from "next/server";
import type { RouteContext } from "@/server/common/types/routeContext";

/** GET /api/workspace-invites/[code] — 초대 코드로 참여할 라이프룸 요약을 보여준다 (비로그인·비멤버도 조회 가능) */
export async function GET(_request: NextRequest, context: RouteContext<{ code: string }>) {
  const { code } = await context.params;

  const inviteCode = normalizeInviteCode(code);
  if (!isValidInviteCodeFormat(inviteCode))
    return NextResponse.json({ message: "유효하지 않은 초대 코드입니다." }, { status: 404 });

  const supabase = await createServerSupabase();
  const preview = await workspaceRepository.findInvitePreviewByCode(supabase, inviteCode);
  if (!preview)
    return NextResponse.json({ message: "유효하지 않은 초대 코드입니다." }, { status: 404 });

  return NextResponse.json(preview);
}

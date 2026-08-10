import { NextResponse } from "next/server";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";
import { workspaceRepository } from "@/server/domain/workspace/repository";
import { profileRepository } from "@/server/domain/profile/repository";
import {
  normalizeInviteCode,
  isValidInviteCodeFormat,
} from "@/features/workspace/utils/inviteCode";

import type { NextRequest } from "next/server";
import type { RouteContext } from "@/server/common/types/routeContext";
import type { WorkspaceJoinRequestDto } from "@/server/domain/workspace/dto";

/**
 * POST /api/workspaces/[id]/join — 라이프룸 참여 (참여자는 세션 사용자로 확정)
 *
 * 참여 근거는 항상 초대 코드다. 코드 검증과 멤버 추가는 DB 함수 안에서 원자적으로 처리되며,
 * 멤버 직접 INSERT는 RLS가 생성 흐름으로만 제한하고 있어 이 경로를 우회할 수 없다.
 */
export async function POST(request: NextRequest, context: RouteContext<{ id: string }>) {
  const { id: workspaceId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as Partial<WorkspaceJoinRequestDto>;

  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const inviteCode = normalizeInviteCode(body.inviteCode ?? "");
  if (!isValidInviteCodeFormat(inviteCode))
    return NextResponse.json({ message: "유효하지 않은 초대 코드입니다." }, { status: 400 });

  // 워크스페이스 멤버의 이름/사진은 profiles 테이블 값을 쓴다 (로그인 콜백에서 항상 생성이 보장됨)
  const { data: profile } = await profileRepository.findById(supabase, sessionUser.id);

  const { workspaceId: joinedId, error } = await workspaceRepository.joinByInviteCode(
    supabase,
    inviteCode,
    { name: profile?.name, email: sessionUser.email, avatarUrl: profile?.avatar_url }
  );
  if (error || !joinedId) {
    console.error("[api] 라이프룸 참여 실패", error);
    return NextResponse.json({ message: "유효하지 않은 초대 코드입니다." }, { status: 403 });
  }
  // 코드가 가리키는 라이프룸과 요청 경로가 어긋나면 클라이언트 상태가 꼬인 것이므로 거절한다
  if (joinedId !== workspaceId)
    return NextResponse.json({ message: "유효하지 않은 초대 코드입니다." }, { status: 403 });

  const { data: workspace, error: wsError } = await workspaceRepository.findById(
    supabase,
    workspaceId
  );
  if (!workspace) {
    console.error("[api] 워크스페이스 조회 실패", wsError);
    return NextResponse.json({ message: "워크스페이스를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(workspace);
}

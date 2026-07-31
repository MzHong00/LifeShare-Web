import { NextResponse } from "next/server";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";
import { POSTGREST_ERROR_CODES } from "@/server/common/constants/codes";
import { workspaceRepository } from "@/server/domain/workspace/repository";

import type { NextRequest } from "next/server";
import type { RouteContext } from "@/server/common/types/routeContext";

/** POST /api/workspaces/[id]/join — 워크스페이스 참여 (참여자는 세션 사용자로 확정) */
export async function POST(_request: NextRequest, context: RouteContext<{ id: string }>) {
  const { id: workspaceId } = await context.params;

  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  // 워크스페이스 멤버의 이름/사진은 profiles 테이블 값을 쓴다 (로그인 콜백에서 항상 생성이 보장됨)
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, avatar_url")
    .eq("id", sessionUser.id)
    .maybeSingle();

  // 이미 멤버인 경우는 unique 제약 위반(23505)으로 걸러지므로 사전 조회 없이 바로 insert한다
  const { error } = await workspaceRepository.insertMember(supabase, workspaceId, {
    userId: sessionUser.id,
    name: profile?.name,
    email: sessionUser.email,
    avatarUrl: profile?.avatar_url,
  });
  if (error && error.code !== POSTGREST_ERROR_CODES.UNIQUE_VIOLATION) {
    console.error("[api] 워크스페이스 참여 실패", error);
    return NextResponse.json({ message: "워크스페이스 참여에 실패했습니다." }, { status: 500 });
  }

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

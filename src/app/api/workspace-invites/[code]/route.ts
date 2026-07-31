import { NextResponse } from "next/server";

import { createServerSupabase } from "@/server/common/utils/supabaseClient";
import { isPastTimestamp } from "@/utils/date";
import { workspaceRepository } from "@/server/domain/workspace/repository";

import type { NextRequest } from "next/server";
import type { RouteContext } from "@/server/common/types/routeContext";

/** GET /api/workspace-invites/[code] — 초대 코드로 워크스페이스 조회 (만료·미존재 시 404) */
export async function GET(_request: NextRequest, context: RouteContext<{ code: string }>) {
  const { code } = await context.params;

  const supabase = await createServerSupabase();
  const { data: invite, error } = await supabase
    .from("workspace_invites")
    .select("workspace_id, expires_at")
    .eq("invite_code", code)
    .single();

  if (error || !invite) {
    console.error("[api] 초대 코드 조회 실패", error);
    return NextResponse.json({ message: "유효하지 않은 초대 코드입니다." }, { status: 404 });
  }
  if (isPastTimestamp(invite.expires_at)) {
    return NextResponse.json({ message: "만료된 초대 코드입니다." }, { status: 404 });
  }

  const { data: workspace, error: wsError } = await workspaceRepository.findById(
    supabase,
    invite.workspace_id
  );
  if (!workspace) {
    console.error("[api] 워크스페이스 조회 실패", wsError);
    return NextResponse.json({ message: "워크스페이스를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(workspace);
}

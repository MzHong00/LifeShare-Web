import { NextResponse } from "next/server";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";
import { workspaceRepository } from "@/server/domain/workspace/repository";

import type { NextRequest } from "next/server";
import type { RouteContext } from "@/server/common/types/routeContext";
import type { MemberUpdateRequestDto } from "@/server/domain/workspace/dto";

/** PATCH /api/workspaces/[id]/members/[userId] — 멤버 프로필 수정 (본인만 가능) */
export async function PATCH(
  request: NextRequest,
  context: RouteContext<{ id: string; userId: string }>
) {
  const { id: workspaceId, userId } = await context.params;
  const body = (await request.json()) as MemberUpdateRequestDto;

  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  if (sessionUser.id !== userId)
    return NextResponse.json({ message: "본인 프로필만 수정할 수 있습니다." }, { status: 403 });

  // update는 매칭 행이 없어도 에러를 던지지 않으므로 select로 실제 수정 여부를 확인한다
  const { data, error } = await supabase
    .from("workspace_members")
    .update({ display_name: body.displayName, avatar_url: body.avatarUrl })
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .select();
  if (error) {
    console.error("[api] 멤버 프로필 수정 실패", error);
    return NextResponse.json({ message: "멤버 프로필 수정에 실패했습니다." }, { status: 500 });
  }
  if (!data || data.length === 0)
    return NextResponse.json({ message: "멤버를 찾을 수 없습니다." }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}

/**
 * DELETE /api/workspaces/[id]/members/[userId] — 워크스페이스 나가기 (본인만 가능)
 *
 * 마지막 멤버가 나가면 아무도 접근할 수 없는 워크스페이스가 남으므로 하위 데이터까지 함께 정리한다.
 * (앱에 별도 삭제 기능은 없고, 이 경로가 유일한 삭제 시점이다)
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext<{ id: string; userId: string }>
) {
  const { id: workspaceId, userId } = await context.params;

  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  if (sessionUser.id !== userId)
    return NextResponse.json({ message: "본인만 나갈 수 있습니다." }, { status: 403 });

  const { count, error: countError } = await workspaceRepository.countMembers(
    supabase,
    workspaceId
  );
  if (countError) {
    console.error("[api] 워크스페이스 멤버 수 조회 실패", countError);
    return NextResponse.json({ message: "워크스페이스 나가기에 실패했습니다." }, { status: 500 });
  }

  // 나 혼자 남은 경우: 멤버 row를 먼저 지우면 RLS 권한을 잃으므로 deleteById가 순서를 맞춰 처리한다
  if (count === 1) {
    const { isDeleted, error } = await workspaceRepository.deleteById(supabase, workspaceId);
    if (error) {
      console.error("[api] 마지막 멤버 나가기 중 워크스페이스 삭제 실패", error);
      return NextResponse.json({ message: "워크스페이스 나가기에 실패했습니다." }, { status: 500 });
    }
    if (!isDeleted) {
      console.error(
        "[api] 워크스페이스 삭제가 반영되지 않음 — workspaces 테이블의 DELETE RLS 정책을 확인하세요",
        { workspaceId }
      );
      return NextResponse.json({ message: "워크스페이스 나가기에 실패했습니다." }, { status: 500 });
    }
    return new NextResponse(null, { status: 204 });
  }

  // delete는 매칭 행이 없어도 에러를 던지지 않으므로 select로 실제 삭제 여부를 확인한다
  const { data, error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .select();
  if (error) {
    console.error("[api] 워크스페이스 나가기 실패", error);
    return NextResponse.json({ message: "워크스페이스 나가기에 실패했습니다." }, { status: 500 });
  }
  if (!data || data.length === 0)
    return NextResponse.json({ message: "멤버를 찾을 수 없습니다." }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}

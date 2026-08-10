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
 * DELETE /api/workspaces/[id]/members/[userId] — 멤버 제거
 *
 * 두 가지 경우를 함께 처리한다.
 *  - 나가기: 본인이 자기 자신을 제거 (누구나 가능)
 *  - 강퇴: owner가 다른 멤버를 제거 (owner는 강퇴 대상이 될 수 없다)
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

  const isSelf = sessionUser.id === userId;
  if (!isSelf) {
    const [actorRole, targetRole] = await Promise.all([
      workspaceRepository.findMemberRole(supabase, workspaceId, sessionUser.id),
      workspaceRepository.findMemberRole(supabase, workspaceId, userId),
    ]);
    if (actorRole !== "owner")
      return NextResponse.json(
        { message: "멤버 내보내기는 라이프룸을 만든 사람만 할 수 있습니다." },
        { status: 403 }
      );
    if (!targetRole)
      return NextResponse.json({ message: "멤버를 찾을 수 없습니다." }, { status: 404 });
    // owner 자리가 비면 아무도 초대·강퇴를 못 하는 잠긴 워크스페이스가 되므로 막는다
    if (targetRole === "owner")
      return NextResponse.json(
        { message: "라이프룸을 만든 사람은 내보낼 수 없습니다." },
        { status: 403 }
      );
  }

  const { count, error: countError } = await workspaceRepository.countMembers(
    supabase,
    workspaceId
  );
  if (countError) {
    console.error("[api] 워크스페이스 멤버 수 조회 실패", countError);
    return NextResponse.json({ message: "멤버 제거에 실패했습니다." }, { status: 500 });
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

  // 방장이 다른 멤버를 남기고 나가면 아무도 초대·강퇴를 못 하는 잠긴 라이프룸이 되므로,
  // 나가기 직전에 남은 멤버 한 명에게 방장을 넘긴다 (대상이 없으면 함수가 아무것도 하지 않는다).
  if (isSelf) {
    const transferError = await workspaceRepository.transferOwnership(supabase, workspaceId);
    if (transferError) {
      console.error("[api] 방장 위임 실패", transferError);
      return NextResponse.json({ message: "멤버 제거에 실패했습니다." }, { status: 500 });
    }
  }

  // delete는 매칭 행이 없어도 에러를 던지지 않으므로 select로 실제 삭제 여부를 확인한다
  const { data, error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .select();
  if (error) {
    console.error("[api] 멤버 제거 실패", error);
    return NextResponse.json({ message: "멤버 제거에 실패했습니다." }, { status: 500 });
  }
  if (!data || data.length === 0)
    return NextResponse.json({ message: "멤버를 찾을 수 없습니다." }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}

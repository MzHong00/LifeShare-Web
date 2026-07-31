import { NextResponse } from "next/server";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";

import type { NextRequest } from "next/server";
import type { RouteContext } from "@/server/common/types/routeContext";
import type { WorkspaceUpdateRequestDto } from "@/server/domain/workspace/dto";

/** PATCH /api/workspaces/[id] — 워크스페이스 이름/시작일/테마 색상 수정 */
export async function PATCH(request: NextRequest, context: RouteContext<{ id: string }>) {
  const { id } = await context.params;
  const body = (await request.json()) as WorkspaceUpdateRequestDto;

  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10); // 오늘 날짜 (YYYY-MM-DD)
  if (body.startDate && body.startDate > today) {
    return NextResponse.json(
      { message: "함께한 날은 오늘 이후 날짜로 설정할 수 없습니다." },
      { status: 400 }
    );
  }

  // update는 매칭 행이 없어도 에러를 던지지 않으므로 select로 실제 수정 여부를 확인한다
  const { data, error } = await supabase
    .from("workspaces")
    .update({
      name: body.name,
      start_date: body.startDate,
      theme_color: body.themeColor,
    })
    .eq("id", id)
    .select();
  if (error) {
    console.error("[api] 워크스페이스 수정 실패", error);
    return NextResponse.json({ message: "워크스페이스 수정에 실패했습니다." }, { status: 500 });
  }
  if (!data || data.length === 0)
    return NextResponse.json({ message: "워크스페이스를 찾을 수 없습니다." }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}

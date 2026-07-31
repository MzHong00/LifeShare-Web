import { NextResponse } from "next/server";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";
import { workspaceRepository } from "@/server/domain/workspace/repository";

import type { NextRequest } from "next/server";
import type { WorkspaceCreateRequestDto } from "@/server/domain/workspace/dto";

/** GET /api/workspaces — 내가 속한 워크스페이스 목록 (멤버 포함) */
export async function GET() {
  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { data: workspaces, error } = await workspaceRepository.findManyByUserId(
    supabase,
    sessionUser.id
  );
  if (error) {
    console.error("[api] 워크스페이스 목록 조회 실패", error);
    return NextResponse.json(
      { message: "워크스페이스 목록 조회에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json(workspaces);
}

/** POST /api/workspaces — 워크스페이스 생성 + 생성자(세션 사용자) 멤버 추가 */
export async function POST(request: NextRequest) {
  const { name, type, startDate } = (await request.json()) as WorkspaceCreateRequestDto;
  if (!name || !type)
    return NextResponse.json({ message: "name, type은 필수입니다." }, { status: 400 });

  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { data: ws, error: wsError } = await workspaceRepository.create(supabase, {
    name,
    type,
    startDate,
    createdBy: sessionUser.id,
  });
  if (wsError || !ws) {
    console.error("[api] 워크스페이스 생성 실패", wsError);
    return NextResponse.json({ message: "워크스페이스 생성에 실패했습니다." }, { status: 500 });
  }

  // 워크스페이스 멤버의 이름/사진은 profiles 테이블 값을 쓴다 (로그인 콜백에서 항상 생성이 보장됨)
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, avatar_url")
    .eq("id", sessionUser.id)
    .maybeSingle();

  const { error: memberError } = await workspaceRepository.insertMember(supabase, ws.id, {
    userId: sessionUser.id,
    name: profile?.name,
    email: sessionUser.email,
    avatarUrl: profile?.avatar_url,
  });
  if (memberError) {
    console.error("[api] 워크스페이스 생성 실패", memberError);
    return NextResponse.json({ message: "워크스페이스 생성에 실패했습니다." }, { status: 500 });
  }

  const { data: workspace, error: findError } = await workspaceRepository.findById(supabase, ws.id);
  if (!workspace) {
    console.error("[api] 워크스페이스 생성 실패", findError);
    return NextResponse.json({ message: "워크스페이스 생성에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ workspace }, { status: 201 });
}

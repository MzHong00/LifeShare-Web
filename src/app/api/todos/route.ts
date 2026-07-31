import { NextResponse } from "next/server";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";
import { todoRepository } from "@/server/domain/todo/repository";
import { rowToTodo } from "@/features/todo/utils/todoUtils";

import type { NextRequest } from "next/server";
import type { TodoRow } from "@/features/todo/utils/todoUtils";
import type { TodoCreateRequestDto } from "@/server/domain/todo/dto";

/** GET /api/todos?workspaceId= — 워크스페이스의 할 일 목록 조회 */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId)
    return NextResponse.json({ message: "workspaceId가 필요합니다." }, { status: 400 });

  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { data, error } = await todoRepository.findManyByWorkspaceId(supabase, workspaceId);
  if (error) {
    console.error("[api] 할 일 목록 조회 실패", error);
    return NextResponse.json({ message: "할 일 목록 조회에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json((data as TodoRow[]).map(rowToTodo));
}

/** POST /api/todos — 할 일 생성 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as TodoCreateRequestDto;
  if (!body.workspaceId || !body.title || !body.startDate || !body.endDate) {
    return NextResponse.json(
      { message: "workspaceId, title, startDate, endDate는 필수입니다." },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { data, error } = await todoRepository.create(supabase, body);
  if (error) {
    console.error("[api] 할 일 생성 실패", error);
    return NextResponse.json({ message: "할 일 생성에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json(rowToTodo(data as TodoRow), { status: 201 });
}

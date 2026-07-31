import { NextResponse } from "next/server";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";
import { POSTGREST_ERROR_CODES } from "@/server/common/constants/codes";
import { todoRepository } from "@/server/domain/todo/repository";
import { rowToTodo } from "@/features/todo/utils/todoUtils";

import type { NextRequest } from "next/server";
import type { RouteContext } from "@/server/common/types/routeContext";
import type { TodoRow } from "@/features/todo/utils/todoUtils";
import type { TodoUpdateRequestDto } from "@/server/domain/todo/dto";

/** PATCH /api/todos/[id] — 할 일 수정(토글 포함) */
export async function PATCH(request: NextRequest, context: RouteContext<{ id: string }>) {
  const { id } = await context.params;
  const body = (await request.json()) as TodoUpdateRequestDto;

  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { data, error } = await todoRepository.update(supabase, id, body);
  if (error) {
    // 존재하지 않는 id를 수정하려 하면 PostgREST가 PGRST116을 던지므로 404로 구분한다
    if (error.code === POSTGREST_ERROR_CODES.NOT_FOUND) {
      console.error("[api] 할 일 조회 실패", error);
      return NextResponse.json({ message: "할 일을 찾을 수 없습니다." }, { status: 404 });
    }
    console.error("[api] 할 일 수정 실패", error);
    return NextResponse.json({ message: "할 일 수정에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json(rowToTodo(data as TodoRow));
}

/** DELETE /api/todos/[id] — 할 일 삭제 */
export async function DELETE(_request: NextRequest, context: RouteContext<{ id: string }>) {
  const { id } = await context.params;

  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { data, error } = await todoRepository.delete(supabase, id);
  if (error) {
    console.error("[api] 할 일 삭제 실패", error);
    return NextResponse.json({ message: "할 일 삭제에 실패했습니다." }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ message: "할 일을 찾을 수 없습니다." }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}

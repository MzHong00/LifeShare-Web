import { NextResponse } from "next/server";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";
import { POSTGREST_ERROR_CODES } from "@/server/common/constants/codes";
import { calendarEventRepository } from "@/server/domain/calendar/repository";
import { rowToEvent } from "@/features/calendar/utils/calendarUtils";

import type { NextRequest } from "next/server";
import type { RouteContext } from "@/server/common/types/routeContext";
import type { CalendarEventRow } from "@/features/calendar/utils/calendarUtils";
import type { CalendarEventUpdateRequestDto } from "@/server/domain/calendar/dto";

/** PATCH /api/calendar-events/[id] — 일정 수정 */
export async function PATCH(request: NextRequest, context: RouteContext<{ id: string }>) {
  const { id } = await context.params;
  const body = (await request.json()) as CalendarEventUpdateRequestDto;

  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { data, error } = await calendarEventRepository.update(supabase, id, body);
  if (error) {
    // 존재하지 않는 id를 수정하려 하면 PostgREST가 PGRST116을 던지므로 404로 구분한다
    if (error.code === POSTGREST_ERROR_CODES.NOT_FOUND) {
      console.error("[api] 일정 조회 실패", error);
      return NextResponse.json({ message: "일정을 찾을 수 없습니다." }, { status: 404 });
    }
    console.error("[api] 일정 수정 실패", error);
    return NextResponse.json({ message: "일정 수정에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json(rowToEvent(data as CalendarEventRow));
}

/** DELETE /api/calendar-events/[id] — 일정 삭제 */
export async function DELETE(_request: NextRequest, context: RouteContext<{ id: string }>) {
  const { id } = await context.params;

  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { data, error } = await calendarEventRepository.delete(supabase, id);
  if (error) {
    console.error("[api] 일정 삭제 실패", error);
    return NextResponse.json({ message: "일정 삭제에 실패했습니다." }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ message: "일정을 찾을 수 없습니다." }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}

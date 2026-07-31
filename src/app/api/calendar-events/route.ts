import { NextResponse } from "next/server";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";
import { calendarEventRepository } from "@/server/domain/calendar/repository";
import { rowToEvent } from "@/features/calendar/utils/calendarUtils";

import type { NextRequest } from "next/server";
import type { CalendarEventRow } from "@/features/calendar/utils/calendarUtils";
import type { CalendarEventCreateRequestDto } from "@/server/domain/calendar/dto";

/** GET /api/calendar-events?workspaceId= — 워크스페이스의 일정 목록 조회 */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId)
    return NextResponse.json({ message: "workspaceId가 필요합니다." }, { status: 400 });

  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { data, error } = await calendarEventRepository.findManyByWorkspaceId(
    supabase,
    workspaceId
  );
  if (error) {
    console.error("[api] 일정 목록 조회 실패", error);
    return NextResponse.json({ message: "일정 목록 조회에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json((data as CalendarEventRow[]).map(rowToEvent));
}

/** POST /api/calendar-events — 일정 생성 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as CalendarEventCreateRequestDto;
  if (!body.workspaceId || !body.title || !body.startDate || !body.endDate) {
    return NextResponse.json(
      { message: "workspaceId, title, startDate, endDate는 필수입니다." },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { data, error } = await calendarEventRepository.create(supabase, body);
  if (error) {
    console.error("[api] 일정 생성 실패", error);
    return NextResponse.json({ message: "일정 생성에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json(rowToEvent(data as CalendarEventRow), { status: 201 });
}

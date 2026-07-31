import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CalendarEventCreateRequestDto,
  CalendarEventUpdateRequestDto,
} from "@/server/domain/calendar/dto";

export const calendarEventRepository = {
  /** 워크스페이스의 일정 목록을 시작일 순으로 가져온다 */
  findManyByWorkspaceId: (supabase: SupabaseClient, workspaceId: string) =>
    supabase
      .from("calendar_events")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("start_date", { ascending: true }),

  /** 일정을 생성한다 */
  create: (supabase: SupabaseClient, input: CalendarEventCreateRequestDto) =>
    supabase
      .from("calendar_events")
      .insert({
        workspace_id: input.workspaceId,
        title: input.title,
        description: input.description,
        start_date: input.startDate,
        end_date: input.endDate,
        start_time: input.startTime,
        end_time: input.endTime,
        is_all_day: input.isAllDay,
        color: input.color,
      })
      .select()
      .single(),

  /** 일정을 수정한다 */
  update: (supabase: SupabaseClient, id: string, input: CalendarEventUpdateRequestDto) =>
    supabase
      .from("calendar_events")
      .update({
        title: input.title,
        description: input.description,
        start_date: input.startDate,
        end_date: input.endDate,
        start_time: input.startTime,
        end_time: input.endTime,
        is_all_day: input.isAllDay,
        color: input.color,
      })
      .eq("id", id)
      .select()
      .single(),

  /** 일정을 삭제한다 (매칭 행이 없어도 에러를 던지지 않으므로 select로 실제 삭제 여부를 확인) */
  delete: (supabase: SupabaseClient, id: string) =>
    supabase.from("calendar_events").delete().eq("id", id).select(),
};

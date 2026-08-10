import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TodoCreateRequestDto, TodoUpdateRequestDto } from "@/server/domain/todo/dto";

/** DTO(camelCase) → todos 컬럼(snake_case) 변환 (생성·수정 공용) */
const toRow = (input: TodoCreateRequestDto | TodoUpdateRequestDto) => ({
  title: input.title,
  description: input.description,
  is_completed: input.isCompleted,
  assignee_id: input.assigneeId,
  start_date: input.startDate,
  end_date: input.endDate,
  color: input.color,
});

export const todoRepository = {
  /** 워크스페이스의 할 일 목록을 최신순으로 가져온다 */
  findManyByWorkspaceId: (supabase: SupabaseClient, workspaceId: string) =>
    supabase
      .from("todos")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),

  /** 할 일을 생성한다 */
  create: (supabase: SupabaseClient, input: TodoCreateRequestDto) =>
    supabase
      .from("todos")
      .insert({ workspace_id: input.workspaceId, ...toRow(input) })
      .select()
      .single(),

  /** 할 일을 수정한다 */
  update: (supabase: SupabaseClient, id: string, input: TodoUpdateRequestDto) =>
    supabase.from("todos").update(toRow(input)).eq("id", id).select().single(),

  /** 할 일을 삭제한다 (매칭 행이 없어도 에러를 던지지 않으므로 select로 실제 삭제 여부를 확인) */
  delete: (supabase: SupabaseClient, id: string) =>
    supabase.from("todos").delete().eq("id", id).select(),
};

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { StoryCreateRequestDto, StoryUpdateRequestDto } from "@/server/domain/story/dto";

export const storyRepository = {
  /** 워크스페이스의 스토리 목록을 날짜 역순으로 가져온다 */
  findManyByWorkspaceId: (supabase: SupabaseClient, workspaceId: string) =>
    supabase
      .from("stories")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("date", { ascending: false }),

  /** 스토리를 생성한다 */
  create: (supabase: SupabaseClient, input: StoryCreateRequestDto) =>
    supabase
      .from("stories")
      .insert({
        workspace_id: input.workspaceId,
        user_id: input.userId,
        title: input.title,
        description: input.description,
        date: input.date,
        thumbnail_url: input.thumbnailUrl,
        path: input.path,
        path_color: input.pathColor,
      })
      .select()
      .single(),

  /** 스토리를 수정한다 */
  update: (supabase: SupabaseClient, id: string, input: StoryUpdateRequestDto) =>
    supabase
      .from("stories")
      .update({
        title: input.title,
        description: input.description,
        date: input.date,
        thumbnail_url: input.thumbnailUrl,
        path: input.path,
        path_color: input.pathColor,
      })
      .eq("id", id)
      .select()
      .single(),

  /** 스토리를 삭제한다 (매칭 행이 없어도 에러를 던지지 않으므로 select로 실제 삭제 여부를 확인) */
  delete: (supabase: SupabaseClient, id: string) =>
    supabase.from("stories").delete().eq("id", id).select(),
};

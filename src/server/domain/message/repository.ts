import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export const messageRepository = {
  /** 워크스페이스의 메시지 목록을 오래된 순으로 가져온다 */
  findManyByWorkspaceId: (supabase: SupabaseClient, workspaceId: string) =>
    supabase
      .from("messages")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true }),

  /** 메시지를 전송한다 */
  create: (supabase: SupabaseClient, workspaceId: string, senderId: string, text: string) =>
    supabase.from("messages").insert({ workspace_id: workspaceId, sender_id: senderId, text }),
};

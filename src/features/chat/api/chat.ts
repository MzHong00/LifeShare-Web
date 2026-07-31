import { formatChatTime } from "@/utils/date";
import { bffFetch } from "@/lib/api/bffClient";

import type { ChatMessage } from "@/features/chat/types/chat";

interface MessageRow {
  id: string;
  workspace_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

/** DB row를 뷰어(userId) 관점의 ChatMessage로 변환한다 (Realtime 구독·API Route에서 공용) */
export const rowToChatMessage = (row: MessageRow, userId: string): ChatMessage => ({
  id: row.id,
  text: row.text,
  sender: row.sender_id === userId ? "me" : "partner",
  senderId: row.sender_id,
  time: formatChatTime(row.created_at),
});

export const chatApi = {
  // 워크스페이스의 메시지 목록 (오래된 순, isMine 판별은 서버가 세션 사용자 기준으로 수행)
  list: async (workspaceId: string): Promise<ChatMessage[]> =>
    bffFetch<ChatMessage[]>(
      `/api/messages?workspaceId=${encodeURIComponent(workspaceId)}`,
      "메시지 목록 조회에 실패했습니다."
    ),

  // 메시지 전송 (발신자는 서버가 세션에서 확정, 실시간 반영은 구독이 담당)
  send: async (workspaceId: string, text: string): Promise<void> =>
    bffFetch<void>("/api/messages", "메시지 전송에 실패했습니다.", {
      method: "POST",
      body: JSON.stringify({ workspaceId, text }),
    }),
};

export type { MessageRow };

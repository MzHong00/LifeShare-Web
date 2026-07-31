import { queryOptions } from "@tanstack/react-query";

import { chatApi } from "@/features/chat/api/chat";

const CHAT_LIST_STALE_TIME_MS = Infinity; // 새 메시지는 Realtime 구독이 캐시에 직접 반영하므로 포커스·재마운트 시 불필요한 재요청 방지

export const chatQueries = {
  all: ["chat"] as const,

  list: (workspaceId: string, userId: string) =>
    queryOptions({
      queryKey: [...chatQueries.all, "messages", workspaceId, userId] as const,
      queryFn: () => chatApi.list(workspaceId),
      enabled: !!workspaceId && !!userId,
      staleTime: CHAT_LIST_STALE_TIME_MS,
    }),
};

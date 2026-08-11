import { queryOptions } from "@tanstack/react-query";

import { storiesApi } from "@/features/stories/api/stories";

/** 스토리 쿼리 키 계층 (all → lists) */
export const storyKeys = {
  all: ["stories"] as const,
  lists: () => [...storyKeys.all, "list"] as const,
  list: (workspaceId: string) => [...storyKeys.lists(), workspaceId] as const,
};

export const storyQueries = {
  list: (workspaceId: string) =>
    queryOptions({
      queryKey: storyKeys.list(workspaceId),
      queryFn: () => storiesApi.list(workspaceId),
      enabled: !!workspaceId,
    }),
};

"use client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { storyQueries } from "@/features/stories/queries/storyQueries";

const RECENT_STORY_DISPLAY_COUNT = 3; // 홈 대시보드에 노출할 최근 스토리 최대 개수

/** 홈 대시보드에 노출할 최근 스토리(최대 3개)를 계산하는 훅 */
export const useHomeStats = () => {
  const { currentWorkspace } = useCurrentWorkspace();
  const workspaceId = currentWorkspace?.id ?? "";

  const { data: stories = [], isLoading } = useQuery(storyQueries.list(workspaceId));

  // 스토리 목록이 그대로면 배열 참조를 유지해 하위 위젯의 불필요한 리렌더를 막는다
  const recentStories = useMemo(() => stories.slice(0, RECENT_STORY_DISPLAY_COUNT), [stories]);

  return { recentStories, isLoading };
};

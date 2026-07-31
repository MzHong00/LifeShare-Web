import { queryOptions } from "@tanstack/react-query";

import { profileApi } from "@/features/profile/api/profile";

const USER_STALE_TIME_MS = 5 * 60 * 1000; // 사용자 정보 stale 기준 시간(ms)

export const authQueries = {
  all: ["auth"] as const,
  user: () =>
    queryOptions({
      queryKey: [...authQueries.all, "user"] as const,
      queryFn: () => profileApi.getProfile(),
      staleTime: USER_STALE_TIME_MS,
    }),
};

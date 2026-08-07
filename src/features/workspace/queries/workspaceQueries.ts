import { queryOptions } from "@tanstack/react-query";

import { workspacesApi } from "@/features/workspace/api/workspaces";

const WORKSPACE_LIST_STALE_TIME_MS = 30 * 1000; // 내 워크스페이스 목록 stale 기준 시간(ms)

// 범위 무효화가 가능하도록 all → 하위 키 계층으로 구성한다
const keys = {
  all: ["workspaces"] as const,
  mine: () => [...keys.all, "mine"] as const,
  inviteCodes: () => [...keys.all, "invite-code"] as const,
  inviteCode: (workspaceId: string) => [...keys.inviteCodes(), workspaceId] as const,
  byInviteCode: (code: string) => [...keys.all, "by-invite-code", code] as const,
};

export const workspaceQueries = {
  keys,

  mine: () =>
    queryOptions({
      queryKey: keys.mine(),
      queryFn: () => workspacesApi.listMine(),
      staleTime: WORKSPACE_LIST_STALE_TIME_MS,
    }),

  /** 워크스페이스의 현재 초대 코드 (설정 화면의 공유 UI에서 사용) */
  inviteCode: (workspaceId: string) =>
    queryOptions({
      queryKey: keys.inviteCode(workspaceId),
      queryFn: () => workspacesApi.getInviteCode(workspaceId),
      enabled: !!workspaceId,
    }),

  /** 초대 코드가 가리키는 라이프룸 요약 (참여 전 미리보기용) */
  byInviteCode: (code: string) =>
    queryOptions({
      queryKey: keys.byInviteCode(code),
      queryFn: () => workspacesApi.getInvitePreview(code),
      enabled: !!code,
      retry: false, // 잘못된 코드는 재시도해도 결과가 같으므로 즉시 에러를 노출한다
    }),
};

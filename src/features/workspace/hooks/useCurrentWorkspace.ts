"use client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useWorkspaceStore } from "@/features/workspace/stores/useWorkspaceStore";
import { workspaceQueries } from "@/features/workspace/queries/workspaceQueries";
import { authQueries } from "@/features/auth/queries/authQueries";

/**
 * 서버의 워크스페이스 목록(mine)과 클라이언트의 currentWorkspaceId를 결합해
 * 현재 워크스페이스를 파생한다. 저장된 ID가 목록에 없으면 첫 워크스페이스로 폴백한다.
 * 멤버 목록의 "나" 항목의 사진은 라이프룸별 커스터마이징을 지원하지 않으므로 항상 전역 프로필 사진으로
 * 덮어쓴다(프로필 설정에서 사진을 바꾸면 모든 라이프룸에 즉시 반영). 이름은 "내 활동 프로필 설정"에서
 * 라이프룸별로 다르게 지정할 수 있으므로 덮어쓰지 않고 서버 값을 그대로 사용한다.
 */
export const useCurrentWorkspace = () => {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const { data: workspaces, isPending, isError } = useQuery(workspaceQueries.mine());
  const { data: user } = useQuery(authQueries.user());

  const list = useMemo(() => {
    if (!workspaces || !user) return workspaces ?? [];
    return workspaces.map((ws) => ({
      ...ws,
      members: ws.members?.map((member) =>
        member.id === user.id ? { ...member, avatar: user.profileImage } : member
      ),
    }));
  }, [workspaces, user]);

  const currentWorkspace = list.find((ws) => ws.id === currentWorkspaceId) ?? list[0] ?? null;

  return { currentWorkspace, workspaces: list, isPending, isError };
};

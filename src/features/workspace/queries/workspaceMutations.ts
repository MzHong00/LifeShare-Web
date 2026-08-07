import { useMutation, useQueryClient } from "@tanstack/react-query";

import { workspacesApi } from "@/features/workspace/api/workspaces";
import { workspaceQueries } from "@/features/workspace/queries/workspaceQueries";

import type { RoomType, ThemeColor } from "@/features/workspace/types/workspace";

/** 내 워크스페이스 목록(mine)을 무효화하는 함수를 돌려준다 (목록에 영향 주는 뮤테이션의 onSuccess에 연결) */
const useInvalidateMine = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: workspaceQueries.keys.mine() });
};

export const useCreateWorkspaceMutation = () => {
  const invalidateMine = useInvalidateMine();
  return useMutation({
    mutationFn: ({ name, type, startDate }: { name: string; type: RoomType; startDate?: string }) =>
      workspacesApi.create(name, type, startDate),
    onSuccess: invalidateMine,
  });
};

export const useJoinWorkspaceMutation = () => {
  const invalidateMine = useInvalidateMine();
  return useMutation({
    mutationFn: ({ workspaceId, inviteCode }: { workspaceId: string; inviteCode: string }) =>
      workspacesApi.join(workspaceId, inviteCode),
    onSuccess: invalidateMine,
  });
};

export const useUpdateWorkspaceNameMutation = () => {
  const invalidateMine = useInvalidateMine();
  return useMutation({
    mutationFn: ({ workspaceId, name }: { workspaceId: string; name: string }) =>
      workspacesApi.updateName(workspaceId, name),
    onSuccess: invalidateMine,
  });
};

export const useUpdateWorkspaceStartDateMutation = () => {
  const invalidateMine = useInvalidateMine();
  return useMutation({
    mutationFn: ({ workspaceId, startDate }: { workspaceId: string; startDate: string }) =>
      workspacesApi.updateStartDate(workspaceId, startDate),
    onSuccess: invalidateMine,
  });
};

export const useUpdateWorkspaceThemeMutation = () => {
  const invalidateMine = useInvalidateMine();
  return useMutation({
    mutationFn: ({ workspaceId, themeColor }: { workspaceId: string; themeColor: ThemeColor }) =>
      workspacesApi.updateThemeColor(workspaceId, themeColor),
    onSuccess: invalidateMine,
  });
};

export const useUpdateWorkspaceMemberMutation = () => {
  const invalidateMine = useInvalidateMine();
  return useMutation({
    mutationFn: ({
      workspaceId,
      userId,
      updates,
    }: {
      workspaceId: string;
      userId: string;
      updates: { displayName?: string; avatarUrl?: string };
    }) => workspacesApi.updateMember(workspaceId, userId, updates),
    onSuccess: invalidateMine,
  });
};

/** 초대 코드를 발급/재발급한다 (재발급 시 이전 코드가 무효가 되므로 캐시된 코드를 갱신한다) */
export const useCreateInviteCodeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId }: { workspaceId: string }) =>
      workspacesApi.createInviteCode(workspaceId),
    onSuccess: (code, { workspaceId }) =>
      queryClient.setQueryData(workspaceQueries.inviteCode(workspaceId).queryKey, code),
  });
};

export const useLeaveWorkspaceMutation = () => {
  const invalidateMine = useInvalidateMine();
  return useMutation({
    mutationFn: ({ workspaceId, userId }: { workspaceId: string; userId: string }) =>
      workspacesApi.leave(workspaceId, userId),
    onSuccess: invalidateMine,
  });
};

export const useRemoveMemberMutation = () => {
  const invalidateMine = useInvalidateMine();
  return useMutation({
    mutationFn: ({ workspaceId, userId }: { workspaceId: string; userId: string }) =>
      workspacesApi.removeMember(workspaceId, userId),
    onSuccess: invalidateMine,
  });
};

"use client";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { ROUTES } from "@/constants/routes";
import { buildInviteLink } from "@/features/workspace/utils/workspaceUtils";
import { modalActions } from "@/stores/useModalStore";
import { toastActions } from "@/stores/useToastStore";
import { globalLoadingActions } from "@/stores/useGlobalLoadingStore";
import { authQueries } from "@/features/auth/queries/authQueries";
import { workspaceActions } from "@/features/workspace/stores/useWorkspaceStore";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import {
  useUpdateWorkspaceNameMutation,
  useUpdateWorkspaceStartDateMutation,
  useUpdateWorkspaceThemeMutation,
  useUpdateWorkspaceMemberMutation,
  useLeaveWorkspaceMutation,
  useCreateInviteCodeMutation,
} from "@/features/workspace/queries/workspaceMutations";

import type { ThemeColor } from "@/features/workspace/types/workspace";

/**
 * 라이프룸 설정 화면(WorkspaceEditView)의 수정·나가기·초대 액션을 담당하는 훅.
 * 각 액션은 뮤테이션 호출과 실패 시 에러 알림까지 책임지며, 컴포넌트는 모달 UI 구성만 담당한다.
 */
export const useWorkspaceEditActions = (workspaceId: string) => {
  const router = useRouter();
  const { data: user } = useQuery(authQueries.user());
  const { currentWorkspace } = useCurrentWorkspace();
  const updateName = useUpdateWorkspaceNameMutation();
  const updateStartDate = useUpdateWorkspaceStartDateMutation();
  const updateTheme = useUpdateWorkspaceThemeMutation();
  const updateMember = useUpdateWorkspaceMemberMutation();
  const leaveWorkspace = useLeaveWorkspaceMutation();
  const createInviteCode = useCreateInviteCodeMutation();

  /** 로딩 오버레이를 띄운 채 액션을 실행하고, 실패 시 오류 알림 모달을 띄운다 (수정 계열 액션 공통 처리) */
  const runMutation = async (
    action: () => Promise<unknown>,
    loadingMessage: string,
    errorMessage: string
  ) => {
    globalLoadingActions.show(loadingMessage);
    try {
      await action();
    } catch (error) {
      const message = error instanceof Error ? error.message : errorMessage;
      modalActions.showModal({ type: "alert", title: "알림", message });
    } finally {
      globalLoadingActions.hide();
    }
  };

  /** 라이프룸 제목을 수정한다 */
  const changeName = (name: string) =>
    runMutation(
      () => updateName.mutateAsync({ workspaceId, name }),
      "제목을 바꾸는 중이에요",
      "제목 수정에 실패했습니다."
    );

  /** 함께한 날(시작일)을 수정한다 */
  const changeStartDate = (startDate: string) =>
    runMutation(
      () => updateStartDate.mutateAsync({ workspaceId, startDate }),
      "날짜를 바꾸는 중이에요",
      "날짜 수정에 실패했습니다."
    );

  /** 워크스페이스 전역 색상 테마를 수정한다 */
  const changeThemeColor = (themeColor: ThemeColor) =>
    runMutation(
      () => updateTheme.mutateAsync({ workspaceId, themeColor }),
      "테마를 바꾸는 중이에요",
      "테마 수정에 실패했습니다."
    );

  /** 내 활동 프로필(표시 이름)을 수정한다 */
  const changeProfileName = (name: string) => {
    if (!user) return Promise.resolve();
    return runMutation(
      () =>
        updateMember.mutateAsync({ workspaceId, userId: user.id, updates: { displayName: name } }),
      "프로필을 바꾸는 중이에요",
      "프로필 수정에 실패했습니다."
    );
  };

  /** 초대 링크를 생성해 클립보드에 복사한다 */
  const invite = async () => {
    if (!user) return;
    try {
      const code = await createInviteCode.mutateAsync({ workspaceId });
      await navigator.clipboard.writeText(buildInviteLink(code));
      toastActions.showToast("초대 링크를 복사했습니다. 파트너에게 공유해보세요.", "success");
    } catch {
      toastActions.showToast("초대 링크 생성에 실패했습니다.", "error");
    }
  };

  /** 라이프룸에서 나가고 목록 화면으로 이동한다 */
  const leave = () => {
    if (!user) return Promise.resolve();
    return runMutation(
      async () => {
        await leaveWorkspace.mutateAsync({ workspaceId, userId: user.id });
        if (workspaceId === currentWorkspace?.id) {
          workspaceActions.setCurrentWorkspaceId(null);
        }
        router.replace(ROUTES.WORKSPACE.LIST.path);
      },
      "나가는 중이에요",
      "나가기에 실패했습니다."
    );
  };

  return {
    isInviting: createInviteCode.isPending,
    changeName,
    changeStartDate,
    changeThemeColor,
    changeProfileName,
    invite,
    leave,
  };
};

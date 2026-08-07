"use client";
import { useQuery } from "@tanstack/react-query";

import { toastActions } from "@/stores/useToastStore";
import { modalActions } from "@/stores/useModalStore";
import { workspaceQueries } from "@/features/workspace/queries/workspaceQueries";
import { useCreateInviteCodeMutation } from "@/features/workspace/queries/workspaceMutations";
import { formatInviteCode, generateInviteLink } from "@/features/workspace/utils/inviteCode";

/**
 * 워크스페이스의 초대 코드 공유를 담당하는 훅.
 *
 * 코드는 워크스페이스당 1개이므로 재발급하면 기존 코드가 즉시 무효가 된다.
 * 되돌릴 수 없는 동작이라 재발급 전에 확인 모달을 거친다.
 */
export const useInviteShare = (workspaceId: string) => {
  const { data: code, isPending } = useQuery(workspaceQueries.inviteCode(workspaceId));
  const createInviteCode = useCreateInviteCodeMutation();

  const displayCode = code ? formatInviteCode(code) : ""; // 화면 표시용 하이픈 표기

  /** 텍스트를 클립보드에 복사하고 결과를 토스트로 알린다 */
  const copyText = async (text: string, successMessage: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toastActions.showToast(successMessage, "success");
    } catch {
      toastActions.showToast("복사에 실패했습니다. 직접 입력해 전달해주세요.", "error");
    }
  };

  /** 초대 코드만 복사한다 (표시된 하이픈 표기 그대로 — 입력 시 정규화되므로 안전하다) */
  const copyCode = () => copyText(displayCode, "초대 코드를 복사했습니다.");

  /** 초대 링크를 복사한다 */
  const copyLink = () =>
    copyText(code ? generateInviteLink(code) : "", "초대 링크를 복사했습니다.");

  /** 초대 코드를 새로 발급한다 (기존 코드는 그 즉시 사용 불가) */
  const regenerate = () => {
    modalActions.showModal({
      type: "confirm",
      title: "초대 코드 재발급",
      message: "새 코드를 발급하면 기존 초대 코드와 링크는 즉시 사용할 수 없게 됩니다.",
      confirmText: "재발급",
      onConfirm: async () => {
        try {
          await createInviteCode.mutateAsync({ workspaceId });
          toastActions.showToast("새 초대 코드를 발급했습니다.", "success");
        } catch {
          toastActions.showToast("초대 코드 발급에 실패했습니다.", "error");
        }
      },
    });
  };

  return {
    code,
    displayCode,
    isPending,
    isRegenerating: createInviteCode.isPending,
    copyCode,
    copyLink,
    regenerate,
  };
};

"use client";
import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { authQueries } from "@/features/auth/queries/authQueries";
import { useSignOutMutation } from "@/features/auth/queries/authMutations";
import { profileApi } from "@/features/profile/api/profile";
import { storageApi } from "@/lib/supabase/storage";

import { modalActions } from "@/stores/useModalStore";
import { resizeImageFile } from "@/utils/imageResize";
import { toastActions } from "@/stores/useToastStore";
import { ROUTES } from "@/constants/routes";

import type { ChangeEvent, ReactNode } from "react";
import type { User } from "@/types/user";

interface UseProfileSettingsResult {
  /** 이름 수정 모달을 띄운다 */
  openEditNameModal: (currentName: string, content: ReactNode, getName: () => string) => void;
  /** 파일 선택 이벤트로 프로필 사진을 교체한다 */
  changePhoto: (event: ChangeEvent<HTMLInputElement>) => void;
  /** 로그아웃 확인 모달을 띄운다 */
  confirmLogout: () => void;
}

/**
 * 설정 화면의 사용자 변경·로그아웃 로직을 담당한다.
 * 사용자 캐시 갱신, 모달/토스트, 세션 정리 등 비-UI 책임을 컴포넌트에서 분리한다.
 */
export const useProfileSettings = (): UseProfileSettingsResult => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutateAsync: signOutMutationAsync } = useSignOutMutation();
  const isUploadingPhotoRef = useRef(false); // 사진 업로드 중 중복 요청 방지

  /** 사용자 쿼리 캐시를 부분 갱신한다 */
  const updateUserCache = useCallback(
    (updates: Partial<User>) => {
      queryClient.setQueryData(authQueries.user().queryKey, (prev: User | null | undefined) =>
        prev ? { ...prev, ...updates } : prev
      );
    },
    [queryClient]
  );

  const openEditNameModal = useCallback(
    (currentName: string, content: ReactNode, getName: () => string) => {
      modalActions.showModal({
        type: "confirm",
        title: "이름 수정",
        confirmText: "변경하기",
        content,
        onConfirm: async () => {
          const nextName = getName().trim();
          if (!nextName) return;
          updateUserCache({ name: nextName });
          try {
            await profileApi.updateProfile({ name: nextName });
            toastActions.showToast("이름이 성공적으로 변경되었습니다", "success");
          } catch {
            updateUserCache({ name: currentName });
            toastActions.showToast("이름 변경에 실패했습니다. 다시 시도해주세요.", "error");
          }
        },
      });
    },
    [updateUserCache]
  );

  const changePhoto = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = ""; // 같은 파일 재선택 시에도 onChange가 다시 발생하도록 초기화
      if (!file || isUploadingPhotoRef.current) return;
      const user = queryClient.getQueryData<User | null>(authQueries.user().queryKey);
      if (!user) return;

      isUploadingPhotoRef.current = true;
      const previousImage = user.profileImage;
      const previewUrl = URL.createObjectURL(file);
      updateUserCache({ profileImage: previewUrl });

      try {
        const resizedFile = await resizeImageFile(file);
        const uploadedUrl = await storageApi.uploadImage(resizedFile, user.id);
        await profileApi.updateProfile({ profileImage: uploadedUrl });
        updateUserCache({ profileImage: uploadedUrl });
        toastActions.showToast("프로필 사진이 변경되었습니다", "success");
      } catch {
        updateUserCache({ profileImage: previousImage });
        toastActions.showToast("프로필 사진 변경에 실패했습니다. 다시 시도해주세요.", "error");
      } finally {
        URL.revokeObjectURL(previewUrl);
        isUploadingPhotoRef.current = false;
      }
    },
    [queryClient, updateUserCache]
  );

  const confirmLogout = useCallback(() => {
    modalActions.showModal({
      type: "confirm",
      title: "로그아웃",
      message: "정말 로그아웃 하시겠어요?",
      onConfirm: async () => {
        try {
          await signOutMutationAsync();
          // currentWorkspaceId는 지우지 않는다 — 재로그인 시 이전에 선택했던 라이프룸이 그대로 유지되어야 하고,
          // 다른 계정으로 로그인하는 경우엔 useCurrentWorkspace가 목록에 없는 ID를 감지해 안전하게 폴백한다
          queryClient.clear();
          router.replace(ROUTES.LOGIN.path);
        } catch {
          toastActions.showToast("로그아웃에 실패했습니다. 다시 시도해주세요.", "error");
        }
      },
    });
  }, [queryClient, router, signOutMutationAsync]);

  return { openEditNameModal, changePhoto, confirmLogout };
};

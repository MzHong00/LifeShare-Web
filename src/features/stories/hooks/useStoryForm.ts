"use client";
import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { authQueries } from "@/features/auth/queries/authQueries";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { toastActions } from "@/stores/useToastStore";
import { storageApi } from "@/lib/supabase/storage";
import { PATH_COLORS } from "@/constants/theme";
import { getTodayDateString, formatDate } from "@/utils/date";
import { storyQueries } from "@/features/stories/queries/storyQueries";
import {
  useCreateStoryMutation,
  useUpdateStoryMutation,
} from "@/features/stories/queries/storyMutations";
import { useStoryImageField } from "@/features/stories/hooks/useStoryImageField";
import { useResetOnChange } from "@/hooks/useResetOnChange";

import type { LocationPoint } from "@/features/stories/types/story";

/**
 * 스토리 작성/수정 폼의 모든 상태와 저장 로직을 담당하는 훅.
 * 컴포넌트는 이 훅이 반환하는 상태·핸들러만 사용해 UI 렌더링에 집중한다.
 */
export const useStoryForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storyId = searchParams.get("storyId");
  const isEditMode = !!storyId; // 수정 모드 여부

  const { data: user } = useQuery(authQueries.user());
  const { currentWorkspace } = useCurrentWorkspace();
  const workspaceId = currentWorkspace?.id ?? "";
  const { data: stories = [], isPending: isStoriesPending } = useQuery(
    storyQueries.list(workspaceId)
  );
  const createStory = useCreateStoryMutation(workspaceId);
  const updateStory = useUpdateStoryMutation(workspaceId);

  // 수정 모드일 때 기존 스토리 참조
  const existingStory = useMemo(
    () => (isEditMode ? stories.find((s) => s.id === storyId) : null),
    [isEditMode, storyId, stories]
  );

  const [title, setTitle] = useState(existingStory?.title || "");
  const [description, setDescription] = useState(existingStory?.description || "");
  const [date, setDate] = useState(
    existingStory ? formatDate(existingStory.date, "YYYY-MM-DD") : getTodayDateString()
  );
  const {
    fileInputRef,
    thumbnailUrl,
    pendingFile,
    previewUrl,
    resetThumbnail,
    handleImageSelect,
    handleRemoveImage,
  } = useStoryImageField(existingStory?.thumbnailUrl);
  const [pathColor, setPathColor] = useState<string>(existingStory?.pathColor ?? PATH_COLORS[0]);
  const [path, setPath] = useState<LocationPoint[]>(existingStory?.path || []);
  const [isPathPickerOpen, setIsPathPickerOpen] = useState(false); // 경로 선택 지도 표시 여부
  const [isSaving, setIsSaving] = useState(false);

  // 수정 모드에서 스토리 쿼리 로드가 초기 렌더보다 늦을 수 있어, 로드 완료(existingStory.id 등장) 시 렌더 중 즉시 폼 값을 채운다
  const existingStoryChanged = useResetOnChange(existingStory?.id);
  if (existingStoryChanged && existingStory) {
    setTitle(existingStory.title || "");
    setDescription(existingStory.description || "");
    setDate(formatDate(existingStory.date, "YYYY-MM-DD"));
    resetThumbnail(existingStory.thumbnailUrl);
    setPathColor(existingStory.pathColor ?? PATH_COLORS[0]);
    setPath(existingStory.path || []);
  }

  /** 경로 선택 완료 시 경로·색상 반영 후 지도 닫기 */
  const handlePathConfirm = (newPath: LocationPoint[], newColor: string) => {
    setPath(newPath);
    setPathColor(newColor);
    setIsPathPickerOpen(false);
  };

  /** 폼 내용을 서버 뮤테이션으로 저장(실패 시 로컬 스토어로 폴백) */
  const handleSave = async () => {
    if (isSaving) return;
    // 현재 워크스페이스 목록에 없는 storyId(다른 워크스페이스 등)로 조작된 요청은 차단
    if (isEditMode && !isStoriesPending && !existingStory) {
      toastActions.showToast("스토리를 찾을 수 없습니다.", "error");
      return;
    }
    setIsSaving(true);

    try {
      let finalThumbnailUrl = thumbnailUrl;

      if (pendingFile && user) {
        try {
          finalThumbnailUrl = await storageApi.uploadImage(pendingFile, user.id);
        } catch {
          // blob URL은 이 탭에서만 유효해 서버에 영구 저장할 수 없으므로, 업로드 전 썸네일로 되돌린다
          toastActions.showToast(
            "이미지 업로드에 실패했습니다. 사진 없이 저장하거나 다시 시도해주세요.",
            "error"
          );
          return;
        }
      }

      const storyData = {
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        date: new Date(date).toISOString(),
        thumbnailUrl: finalThumbnailUrl,
        path,
        pathColor,
      };

      if (isEditMode && storyId) {
        await updateStory.mutateAsync({ id: storyId, data: storyData });
      } else {
        await createStory.mutateAsync({
          ...storyData,
          userId: user?.id ?? "",
          workspaceId,
        });
      }

      toastActions.showToast(
        isEditMode ? "기억이 수정되었습니다." : "기억이 기록되었습니다.",
        "success"
      );
      router.back();
    } catch {
      toastActions.showToast("저장에 실패했습니다. 잠시 후 다시 시도해주세요.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isEditMode,
    fileInputRef,
    title,
    setTitle,
    description,
    setDescription,
    date,
    setDate,
    previewUrl,
    pathColor,
    path,
    setPath,
    isPathPickerOpen,
    setIsPathPickerOpen,
    isSaving,
    handleImageSelect,
    handleRemoveImage,
    handlePathConfirm,
    handleSave,
  };
};

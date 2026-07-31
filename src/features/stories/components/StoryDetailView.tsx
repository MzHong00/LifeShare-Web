"use client";
import { useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Edit3, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { ROUTES } from "@/constants/routes";
import { modalActions } from "@/stores/useModalStore";
import { toastActions } from "@/stores/useToastStore";
import { AppHeader } from "@/components/layout/AppHeader";
import { storyActions } from "@/features/stories/stores/useStoryStore";
import { storyQueries } from "@/features/stories/queries/storyQueries";
import { useDeleteStoryMutation } from "@/features/stories/queries/storyMutations";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { StoryDetailContent } from "@/features/stories/components/StoryDetailContent";

import styles from "./StoryDetailView.module.scss";

import type { Story } from "@/features/stories/types/story";

export const StoryDetailView = () => {
  const router = useRouter();
  const params = useParams();
  const storyId = params.id as string;
  const { currentWorkspace } = useCurrentWorkspace();
  const { data: stories = [] } = useQuery(storyQueries.list(currentWorkspace?.id ?? ""));
  const deleteStory = useDeleteStoryMutation(currentWorkspace?.id ?? "");
  const story = useMemo<Story | null>(
    () => stories.find((s) => s.id === storyId) ?? null,
    [stories, storyId]
  );

  const handleDelete = () => {
    modalActions.showModal({
      type: "confirm",
      title: "스토리 삭제",
      message: "정말로 이 스토리를 삭제하시겠습니까? 삭제된 스토리는 복구할 수 없습니다.",
      confirmText: "삭제",
      cancelText: "취소",
      onConfirm: async () => {
        try {
          await deleteStory.mutateAsync(storyId);
          storyActions.setSelectedStoryId(null);
          router.replace(ROUTES.STORIES.path);
        } catch {
          toastActions.showToast("스토리 삭제에 실패했습니다. 다시 시도해주세요.", "error");
        }
      },
    });
  };

  if (!story) {
    return (
      <div className={styles.notFound}>
        <p>스토리를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <AppHeader
        rightElement={
          <div className={styles.headerButtons}>
            <button onClick={handleDelete} className={styles.headerButton} aria-label="스토리 삭제">
              <Trash2 size={20} color="var(--error)" />
            </button>
            <button
              onClick={() => router.push(ROUTES.STORIES.EDIT.query({ storyId }))}
              className={styles.headerButton}
              aria-label="스토리 수정"
            >
              <Edit3 size={20} color="var(--grey-900)" />
            </button>
          </div>
        }
      />

      <StoryDetailContent story={story} />
    </div>
  );
};

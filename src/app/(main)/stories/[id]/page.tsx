"use client";
import { useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Map, Edit3, Trash2 } from "lucide-react";
import { useStoryStore, storyActions } from "@/stores/useStoryStore";
import { modalActions } from "@/stores/useModalStore";
import type { Story } from "@/types";
import { AppHeader } from "@/components/common/AppHeader";
import { StoryBriefInfo } from "@/components/stories/StoryBriefInfo";
import styles from "./storyDetail.module.scss";

export default function StoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const storyId = params.id as string;
  const stories = useStoryStore((s) => s.stories);
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
      onConfirm: () => {
        storyActions.deleteStory(storyId);
        storyActions.setSelectedStoryId(null);
        router.replace("/stories");
      },
    });
  };

  const handleShowOnMap = () => {
    storyActions.setSelectedStoryId(storyId);
    router.push("/map");
  };

  if (!story) {
    return (
      <div className={styles.notFound}>
        <p>스토리를 찾을 수 없어요.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <AppHeader
        rightElement={
          <div className={styles.headerButtons}>
            <button onClick={handleDelete} className={styles.headerButton}>
              <Trash2 size={20} color="var(--error)" />
            </button>
            <button
              onClick={() => router.push(`/stories/edit?storyId=${storyId}`)}
              className={styles.headerButton}
            >
              <Edit3 size={20} color="var(--grey-900)" />
            </button>
          </div>
        }
      />

      <div className={styles.content}>
        <StoryBriefInfo story={story} />

        {story.thumbnailUrl && (
          <img src={story.thumbnailUrl} alt={story.title} className={styles.thumbnail} />
        )}

        {story.description && (
          <p className={styles.description}>{story.description}</p>
        )}

        <button onClick={handleShowOnMap} className={styles.mapButton}>
          <div className={styles.mapIconWrap}>
            <Map size={24} />
          </div>
          <div className={styles.mapInfo}>
            <p className={styles.mapTitle}>지도에서 경로 보기</p>
            <p className={styles.mapDesc}>그날 우리의 이동 동선을 확인해보세요</p>
          </div>
        </button>
      </div>
    </div>
  );
}

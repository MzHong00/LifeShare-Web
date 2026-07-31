"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Map, MapPin, Plus } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { storyActions } from "@/features/stories/stores/useStoryStore";
import { isShellStory } from "@/features/stories/constants/previewMockStories";
import { formatDate } from "@/utils/date";

import styles from "./StoryDetailContent.module.scss";

import type { Story } from "@/features/stories/types/story";

interface StoryDetailContentProps {
  story: Story;
}

/**
 * 스토리 상세 본문(히어로 이미지·날짜·제목·경로·설명·지도 보기 버튼).
 * 상세 페이지와 홈 피드의 펼침 오버레이가 동일한 상세 UI를 공유하기 위한 프레젠테이션 컴포넌트.
 */
export const StoryDetailContent = ({ story }: StoryDetailContentProps) => {
  const router = useRouter();
  const isShell = isShellStory(story); // 예시(껍데기) 스토리 여부

  const handleShowOnMap = () => {
    storyActions.setSelectedStoryId(story.id);
    router.push(ROUTES.MAP.path);
  };

  const handleCreate = () => {
    router.push(ROUTES.STORIES.EDIT.path);
  };

  return (
    <div className={styles.content}>
      {story.thumbnailUrl ? (
        <div className={styles.imageWrap}>
          <Image
            src={story.thumbnailUrl}
            alt=""
            fill
            sizes="100vw"
            className={styles.photo}
            draggable={false}
          />
        </div>
      ) : (
        <div className={styles.placeholder}>
          <MapPin size={48} className={styles.placeholderIcon} />
        </div>
      )}

      <div className={styles.details}>
        <div className={styles.metaRow}>
          {formatDate(story.date) && <span className={styles.date}>{formatDate(story.date)}</span>}
          {story.path.length > 0 && (
            <span className={styles.pathMeta}>
              <span className={styles.pathDot} style={{ backgroundColor: story.pathColor }} />
              경로 {story.path.length}개 지점
            </span>
          )}
        </div>

        <h1 className={styles.title}>{story.title || "제목 없음"}</h1>

        {story.description && <p className={styles.description}>{story.description}</p>}

        {isShell ? (
          <>
            <p className={styles.shellNote}>
              아직 기록되지 않은 예시 카드예요. 우리만의 기억을 남겨 이 자리를 채워보세요.
            </p>
            <button onClick={handleCreate} className={styles.mapButton}>
              <div className={styles.mapIconWrap}>
                <Plus size={24} />
              </div>
              <div className={styles.mapInfo}>
                <p className={styles.mapTitle}>직접 기억 기록하기</p>
                <p className={styles.mapDesc}>오늘 함께한 순간을 남겨보세요</p>
              </div>
            </button>
          </>
        ) : (
          <button onClick={handleShowOnMap} className={styles.mapButton}>
            <div className={styles.mapIconWrap}>
              <Map size={24} />
            </div>
            <div className={styles.mapInfo}>
              <p className={styles.mapTitle}>지도에서 경로 보기</p>
              <p className={styles.mapDesc}>그날 우리의 이동 동선을 확인해보세요</p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

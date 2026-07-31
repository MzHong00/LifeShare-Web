import Image from "next/image";

import { StoryBriefInfo } from "@/features/stories/components/StoryBriefInfo";

import styles from "./MapStoryInfo.module.scss";

import type { Story } from "@/features/stories/types/story";

interface MapStoryInfoProps {
  story: Story;
}

/** 지도 마커 클릭 시 표시되는 스토리 요약 정보(썸네일·설명 포함) */
export const MapStoryInfo = ({ story }: MapStoryInfoProps) => {
  return (
    <div className={styles.container}>
      <StoryBriefInfo story={story} />

      {story.thumbnailUrl && (
        <div className={styles.thumbnailWrap}>
          <Image
            src={story.thumbnailUrl}
            alt={story.title ?? ""}
            fill
            className={styles.thumbnail}
          />
        </div>
      )}

      {story.description && <p className={styles.description}>{story.description}</p>}
    </div>
  );
};

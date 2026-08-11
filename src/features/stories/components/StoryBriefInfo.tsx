import { MapPin, Calendar } from "lucide-react";

import { formatDate } from "@/utils/date";
import { ICON_SIZE } from "@/constants/style";

import styles from "./StoryBriefInfo.module.scss";

import type { Story } from "@/features/stories/types/story";
import type { CSSProperties } from "react";

interface StoryBriefInfoProps {
  story: Story;
}

/** 스토리 상세 상단의 제목·날짜·경로 요약 정보 */
export const StoryBriefInfo = ({ story }: StoryBriefInfoProps) => {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{story.title}</h1>
      <div className={styles.metaRow}>
        <div className={styles.metaItem}>
          <Calendar size={ICON_SIZE.md} color="var(--grey-400)" />
          <span>{formatDate(story.date)}</span>
        </div>
        {story.path.length > 0 && (
          <div className={styles.metaItem}>
            <div
              className={styles.pathDot}
              style={{ "--path-color": story.pathColor } as CSSProperties}
            />
            <span>경로 {story.path.length}개 지점</span>
          </div>
        )}
      </div>
    </div>
  );
};

import { MapPin, Calendar } from "lucide-react";
import type { Story } from "@/types";
import { formatDate } from "@/utils/date";
import styles from "./StoryBriefInfo.module.scss";

interface StoryBriefInfoProps {
  story: Story;
}

export const StoryBriefInfo = ({ story }: StoryBriefInfoProps) => {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{story.title}</h1>
      <div className={styles.metaRow}>
        <div className={styles.metaItem}>
          <Calendar size={14} color="var(--grey-400)" />
          <span>{formatDate(story.date)}</span>
        </div>
        {story.path.length > 0 && (
          <div className={styles.metaItem}>
            <div className={styles.pathDot} style={{ backgroundColor: story.pathColor }} />
            <span>경로 {story.path.length}개 지점</span>
          </div>
        )}
      </div>
    </div>
  );
};

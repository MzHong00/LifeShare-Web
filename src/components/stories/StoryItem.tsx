import { MapPin } from "lucide-react";
import type { Story } from "@/types";
import { formatDate } from "@/utils/date";
import styles from "./StoryItem.module.scss";

interface StoryItemProps {
  story: Story;
  onPress: (id: string) => void;
}

export const StoryItem = ({ story, onPress }: StoryItemProps) => {
  return (
    <button onClick={() => onPress(story.id)} className={styles.item}>
      <div
        className={styles.thumbnail}
        style={{
          backgroundColor: story.pathColor + "20",
          height: story.thumbnailUrl ? 160 : 120,
        }}
      >
        {story.thumbnailUrl ? (
          <img
            src={story.thumbnailUrl}
            alt={story.title}
            className={styles.thumbnailImage}
            style={{ height: story.thumbnailUrl ? 160 : 120 }}
          />
        ) : (
          <MapPin size={32} style={{ color: story.pathColor }} />
        )}
      </div>
      <div className={styles.info}>
        <p className={styles.title}>{story.title}</p>
        <p className={styles.date}>{formatDate(story.date, "YYYY.MM.DD")}</p>
      </div>
    </button>
  );
};

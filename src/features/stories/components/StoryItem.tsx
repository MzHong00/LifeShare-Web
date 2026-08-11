import { MapPin } from "lucide-react";
import Image from "next/image";

import { formatDate } from "@/utils/date";
import { cx } from "@/utils/cn";
import { ICON_SIZE } from "@/constants/style";

import styles from "./StoryItem.module.scss";

import type { Story } from "@/features/stories/types/story";
import type { CSSProperties } from "react";

interface StoryItemProps {
  story: Story;
  onPress: (id: string) => void;
}

/** 스토리 목록의 썸네일 카드 아이템 */
export const StoryItem = ({ story, onPress }: StoryItemProps) => {
  const hasThumbnail = !!story.thumbnailUrl; // 썸네일 이미지 존재 여부

  return (
    <button onClick={() => onPress(story.id)} className={styles.item}>
      <div
        className={cx(
          styles.thumbnail,
          hasThumbnail ? styles.thumbnailTall : styles.thumbnailShort
        )}
        style={{ "--path-color": story.pathColor } as CSSProperties}
      >
        {hasThumbnail ? (
          <Image
            src={story.thumbnailUrl as string}
            alt={story.title ?? ""}
            fill
            sizes="(max-width: 768px) 50vw, 240px"
            className={styles.thumbnailImage}
          />
        ) : (
          <MapPin size={ICON_SIZE["2xl"]} className={styles.thumbnailIcon} />
        )}
      </div>
      <div className={styles.info}>
        <p className={styles.title}>{story.title}</p>
        <p className={styles.date}>{formatDate(story.date, "YYYY.MM.DD")}</p>
      </div>
    </button>
  );
};

"use client";
import { useRouter } from "next/navigation";
import { ChevronRight, MapPin } from "lucide-react";
import { useStoryStore } from "@/stores/useStoryStore";
import { formatDate } from "@/utils/date";
import { Card } from "@/components/common/Card";
import styles from "./RecentStories.module.scss";

export const RecentStories = () => {
  const router = useRouter();
  const stories = useStoryStore((s) => s.stories);
  const recentStories = stories.slice(0, 5);

  if (recentStories.length === 0) return null;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>최근 스토리</h2>
        <button onClick={() => router.push("/stories")} className={styles.moreButton}>
          <span>더보기</span>
          <ChevronRight size={14} />
        </button>
      </div>

      <div className={styles.scrollRow}>
        {recentStories.map((story) => (
          <button
            key={story.id}
            onClick={() => router.push(`/stories/${story.id}`)}
            className={styles.storyButton}
          >
            <Card style={{ overflow: "hidden", borderRadius: 16, padding: 0 }}>
              <div
                className={styles.thumbnail}
                style={{ backgroundColor: story.pathColor + "20" }}
              >
                {story.thumbnailUrl ? (
                  <img
                    src={story.thumbnailUrl}
                    alt={story.title}
                    className={styles.thumbnailImage}
                    style={{ height: 96 }}
                  />
                ) : (
                  <MapPin size={28} style={{ color: story.pathColor }} />
                )}
              </div>
              <div className={styles.info}>
                <p className={styles.storyTitle}>{story.title}</p>
                <p className={styles.storyDate}>{formatDate(story.date, "MM/DD")}</p>
              </div>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
};

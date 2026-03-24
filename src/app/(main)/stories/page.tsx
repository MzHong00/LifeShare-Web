"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus } from "lucide-react";
import { useStoryStore } from "@/stores/useStoryStore";
import { StoryItem } from "@/components/stories/StoryItem";
import styles from "./stories.module.scss";

export default function StoriesPage() {
  const router = useRouter();
  const stories = useStoryStore((s) => s.stories);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStories = useMemo(() => {
    return stories.filter((story) =>
      story.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stories, searchQuery]);

  const leftCol = filteredStories.filter((_, i) => i % 2 === 0);
  const rightCol = filteredStories.filter((_, i) => i % 2 !== 0);

  return (
    <div className={styles.page}>
      <div className={styles.searchRow}>
        <div className={styles.searchBox}>
          <Search size={18} style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="추억을 검색해보세요"
            className={styles.searchInput}
          />
        </div>
        <button onClick={() => router.push("/stories/edit")} className={styles.addButton}>
          <Plus size={22} strokeWidth={2.5} />
        </button>
      </div>

      <div className={styles.grid}>
        {filteredStories.length === 0 ? (
          <div className={styles.empty}>
            <p>{searchQuery ? "검색 결과가 없어요." : "아직 스토리가 없어요."}</p>
            {!searchQuery && (
              <button onClick={() => router.push("/stories/edit")} className={styles.emptyLink}>
                첫 스토리 기록하기
              </button>
            )}
          </div>
        ) : (
          <div className={styles.columns}>
            <div className={styles.col}>
              {leftCol.map((story) => (
                <StoryItem key={story.id} story={story} onPress={(id) => router.push(`/stories/${id}`)} />
              ))}
            </div>
            <div className={`${styles.col} ${styles.colOffset}`}>
              {rightCol.map((story) => (
                <StoryItem key={story.id} story={story} onPress={(id) => router.push(`/stories/${id}`)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

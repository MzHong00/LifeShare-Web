"use client";
import { useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus } from "lucide-react";
import { useStoryStore } from "@/stores/useStoryStore";
import { useQueryParams } from "@/hooks/useQueryParams";
import { StoryItem } from "@/components/stories/StoryItem";
import styles from "./stories.module.scss";

// useSearchParams를 사용하므로 Suspense 경계 안에서 렌더링해야 한다.
function StoriesContent() {
  const router = useRouter();
  const [params, setParams] = useQueryParams();
  const stories = useStoryStore((s) => s.stories);

  // ?q= 파라미터로 검색어를 관리한다.
  // 뒤로가기 시 검색 상태가 복원되고, URL 공유 시 동일한 검색 결과를 볼 수 있다.
  const searchQuery = params.get("q") || "";

  // 제목 기준 대소문자 무시 검색
  const filteredStories = useMemo(() => {
    return stories.filter((story) =>
      story.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stories, searchQuery]);

  // 두 컬럼에 홀짝 인덱스로 번갈아 배치해 핀터레스트 스타일 그리드를 구성한다.
  const leftCol = filteredStories.filter((_, i) => i % 2 === 0);
  const rightCol = filteredStories.filter((_, i) => i % 2 !== 0);

  // 검색어 변경 시 URL을 업데이트한다.
  // 빈 문자열이면 파라미터를 제거해 URL을 깔끔하게 유지한다.
  const handleSearchChange = (value: string) => {
    if (value) {
      setParams.set("q", value);
    } else {
      setParams.delete("q");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.searchRow}>
        <div className={styles.searchBox}>
          <Search size={18} style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
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
            {/* 검색 중일 때와 데이터가 없을 때 메시지를 구분한다 */}
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

export default function StoriesPage() {
  // useSearchParams 사용 시 Next.js App Router에서 Suspense 래핑이 필요하다.
  return (
    <Suspense>
      <StoriesContent />
    </Suspense>
  );
}

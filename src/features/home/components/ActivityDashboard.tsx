"use client";
import { Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { ICON_SIZE } from "@/constants/iconSize";
import { ROUTES } from "@/constants/routes";
import { useHomeStats } from "@/features/home/hooks/useHomeStats";
import { formatDate } from "@/utils/date";
import { Skeleton } from "@/components/feedback/Skeleton";

import styles from "./ActivityDashboard.module.scss";

const RECENT_STORY_SKELETON_COUNT = 3; // 최근 스토리 로딩 시 표시할 스켈레톤 카드 개수

/** 홈 하단에 두 사람의 최근 추억들을 35mm 필름 스트립 롤 형태로 가로 스냅 스크롤하는 아날로그 감성 위젯 */
export const ActivityDashboard = () => {
  const router = useRouter();
  const { recentStories, isLoading } = useHomeStats();

  return (
    <div className={styles.dashboard}>
      <h3 className={styles.sectionTitle}>최근 기록한 순간</h3>

      {isLoading ? (
        <ul className={styles.storyList}>
          {Array.from({ length: RECENT_STORY_SKELETON_COUNT }).map((_, index) => (
            <li key={index} className={styles.storyItem}>
              <Skeleton height={140} radius={24} />
            </li>
          ))}
        </ul>
      ) : recentStories && recentStories.length > 0 ? (
        <ul className={styles.storyList}>
          {recentStories.map((story) => (
            <li key={story.id} className={styles.storyItem}>
              <button
                type="button"
                onClick={() => router.push(ROUTES.STORIES.detail(story.id))}
                className={styles.recentStoryCard}
                aria-label={`기록한 스토리 ${story.title ?? "제목 없음"}, 스토리 상세로 이동`}
              >
                {story.thumbnailUrl ? (
                  <div
                    className={styles.cardBgImage}
                    style={{ backgroundImage: `url(${story.thumbnailUrl})` }}
                  />
                ) : (
                  <div className={styles.cardBgPlaceholder} />
                )}

                <div className={styles.cardContent}>
                  <div className={styles.cardBody}>
                    <h4 className={styles.recentStoryTitle}>{story.title || "제목 없는 순간"}</h4>
                    <span className={styles.recentStoryDate}>
                      {formatDate(story.date, "YYYY. MM. DD")}
                    </span>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <button
          type="button"
          onClick={() => router.push(ROUTES.STORIES.path)}
          className={styles.emptyStoryCard}
          aria-label="최근 기록한 스토리가 없습니다. 첫 번째 추억을 기록해보세요."
        >
          <div className={styles.emptyContent}>
            <div className={styles.emptyBadge}>
              <Sparkles size={18} className={styles.emptyIcon} />
            </div>
            <div className={styles.emptyTexts}>
              <p className={styles.emptyTitle}>아직 함께한 스토리가 없어요</p>
              <p className={styles.emptySub}>소중한 오늘의 추억을 첫 번째 스토리로 기록해 보세요</p>
            </div>
            <div className={styles.writeButton}>
              <Plus size={ICON_SIZE.md} />
              <span>기록하기</span>
            </div>
          </div>
        </button>
      )}
    </div>
  );
};

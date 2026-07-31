"use client";
import { useMemo } from "react";

import { LayoutGrid, Sparkles } from "lucide-react";

import { useCountUp } from "@/features/stories/hooks/useCountUp";
import { isThisMonth } from "@/utils/date";

import styles from "./StoryBoardHeader.module.scss";

import type { Story } from "@/features/stories/types/story";

interface StoryBoardHeaderProps {
  stories: Story[]; // 통계 계산용 실 스토리 목록(껍데기 제외)
  onListClick: () => void; // 목록 화면으로 이동
}

/** 스토리 보드 상단 플로팅 오버레이: 추억 티켓 형태의 통계(카운트업) + 목록 이동 스텁 버튼 */
export const StoryBoardHeader = ({ stories, onListClick }: StoryBoardHeaderProps) => {
  // 이번 달에 기록된 스토리 개수
  const thisMonthCount = useMemo(
    () => stories.filter((story) => isThisMonth(story.date)).length,
    [stories]
  );

  const totalCount = useCountUp(stories.length); // 총 스토리 카운트업 표시값
  const monthCount = useCountUp(thisMonthCount); // 이번달 카운트업 표시값

  return (
    <header className={styles.overlay}>
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>총 스토리</span>
          <span className={styles.statValue}>{totalCount}개</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>
            이번달
            {thisMonthCount > 0 && <Sparkles size={10} className={styles.spark} aria-hidden />}
          </span>
          <span className={styles.statValue}>{monthCount}개</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onListClick}
        className={styles.listButton}
        aria-label="스토리 목록 보기"
      >
        <LayoutGrid size={18} />
      </button>
    </header>
  );
};

"use client";
import { memo } from "react";

import { MapPin, X } from "lucide-react";
import Image from "next/image";

import { cx } from "@/utils/cn";
import { formatDate } from "@/utils/date";

import styles from "./MemoryCard.module.scss";

import type { Story } from "@/features/stories/types/story";

interface MemoryCardProps {
  story: Story;
  isExpanded?: boolean;
  onClose?: (e: React.MouseEvent) => void;
  shouldShowDate?: boolean;
  isShell?: boolean; // 예시(껍데기) 카드 여부 — 점선 표시로 구분
}

// StoryBoardView에서 드래그 등으로 currentIndex/focus가 자주 바뀌어도, story 등 props가 그대로면
// 최대 20장의 카드(이미지 포함)가 함께 리렌더되는 것을 방지한다
const MemoryCardComponent = ({
  story,
  isExpanded,
  onClose,
  shouldShowDate,
  isShell,
}: MemoryCardProps) => {
  const cardTitle = story.title || story.description || "제목 없음";

  if (isExpanded) {
    return (
      <div className={cx(styles.card, styles.expanded)} aria-label={`기억 상세, ${cardTitle}`}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="상세 닫기"
          >
            <X size={20} />
          </button>
        )}

        <div className={styles.expandedContent}>
          {story.thumbnailUrl ? (
            <div className={styles.expandedImageWrap}>
              <Image src={story.thumbnailUrl} alt="" fill className={styles.expandedPhoto} />
            </div>
          ) : (
            <div className={styles.expandedPlaceholder}>
              <MapPin size={48} className={styles.expandedPlaceholderIcon} />
            </div>
          )}

          <div className={styles.expandedDetails}>
            <div className={styles.metaRow}>
              <span className={styles.expandedDate}>{story.date}</span>
            </div>
            <h2 className={styles.expandedTitle}>{cardTitle}</h2>
            <p className={styles.expandedDesc}>
              {story.description || "오늘 함께한 특별한 순간의 기록이 담겨 있습니다."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cx(styles.card, isShell && styles.shell)} aria-label={`기억, ${cardTitle}`}>
      {story.thumbnailUrl ? (
        <Image src={story.thumbnailUrl} alt="" aria-hidden="true" fill className={styles.photo} />
      ) : (
        <div className={styles.photoPlaceholder}>
          <MapPin size={24} className={styles.photoPlaceholderIcon} />
        </div>
      )}

      <div className={styles.overlay}>
        {shouldShowDate && story.date && (
          <span className={styles.dateBadge}>{formatDate(story.date, "YYYY.MM.DD")}</span>
        )}
        <p className={styles.caption}>{cardTitle}</p>
      </div>
    </div>
  );
};

/** 기억(스토리) 카드 — 축소/확대 상태에 따라 요약 또는 상세 정보를 표시 */
export const MemoryCard = memo(MemoryCardComponent);
MemoryCard.displayName = "MemoryCard";

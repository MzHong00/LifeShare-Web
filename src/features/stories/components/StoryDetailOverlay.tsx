"use client";
import { X } from "lucide-react";

import { StoryDetailContent } from "@/features/stories/components/StoryDetailContent";
import { useSwipeDismiss } from "@/features/stories/hooks/useSwipeDismiss";

import styles from "./StoryDetailOverlay.module.scss";

import type { Story } from "@/features/stories/types/story";

interface StoryDetailOverlayProps {
  story: Story;
  /** 오버레이 닫기 핸들러 */
  onClose: () => void;
}

/**
 * 보드 전체를 덮는 스토리 상세 오버레이.
 * 닫기 버튼 또는 좌우 스와이프(임계값 초과 시 날아가며 닫힘)로 닫을 수 있다.
 */
export const StoryDetailOverlay = ({ story, onClose }: StoryDetailOverlayProps) => {
  const { overlayRef, handlePointerDown, handlePointerMove, handlePointerUp } =
    useSwipeDismiss(onClose);

  return (
    <div
      ref={overlayRef}
      className={styles.detailOverlay}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <button type="button" onClick={onClose} className={styles.detailClose} aria-label="상세 닫기">
        <X size={20} />
      </button>
      <StoryDetailContent story={story} />
    </div>
  );
};

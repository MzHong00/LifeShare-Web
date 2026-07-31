"use client";
import { memo } from "react";
import { CheckCircle2 } from "lucide-react";

import { ProfileImage } from "@/components/ui/ProfileImage";
import { COLORS } from "@/constants/theme";
import { getRelativeDateLabel, isPastDate, isToday } from "@/utils/date";
import { cx } from "@/utils/cn";

import styles from "./TodoItem.module.scss";

import type { Todo } from "@/features/todo/types/todo";
import type { WorkspaceMember } from "@/features/workspace/types/workspace";

interface TodoItemProps {
  item: Todo;
  assignee?: WorkspaceMember;
  /** 완료 토글 핸들러 */
  onToggle: (id: string) => void;
  /** 항목 클릭(상세/수정 이동) 핸들러 */
  onPress: (id: string) => void;
}

export const TodoItem = memo(({ item, assignee, onToggle, onPress }: TodoItemProps) => {
  const dateLabel = getRelativeDateLabel(item.endDate); // 종료일 기준 상대 날짜 라벨
  const markerColor = item.color || COLORS.primary; // 완료 표시 마커 색상
  // 미완료 상태에서 마감이 지났거나 오늘인 경우 마감 임박을 시각적으로 강조한다
  const isOverdue = !item.isCompleted && isPastDate(item.endDate);
  const isDueToday = !item.isCompleted && isToday(item.endDate);

  return (
    <div className={cx(styles.item, item.isCompleted && styles.itemDone)}>
      <button
        onClick={() => onToggle(item.id)}
        className={styles.toggleButton}
        aria-label={item.isCompleted ? "완료 취소" : "완료 처리"}
      >
        {item.isCompleted ? (
          <CheckCircle2 size={26} color={markerColor} fill={`${markerColor}40`} />
        ) : (
          <div className={styles.circle} style={{ borderColor: item.color || COLORS.border }} />
        )}
      </button>

      <button onClick={() => onPress(item.id)} className={styles.contentButton}>
        <div className={styles.titleRow}>
          <p className={cx(styles.title, item.isCompleted && styles.titleDone)}>{item.title}</p>
          {item.isCompleted && <span className={styles.doneBadge}>완료</span>}
        </div>
        <p
          className={cx(
            styles.dateLabel,
            isOverdue && styles.dateLabelOverdue,
            isDueToday && styles.dateLabelToday
          )}
        >
          {dateLabel}
        </p>
      </button>

      {assignee && <ProfileImage uri={assignee.avatar} name={assignee.name} size={28} />}
    </div>
  );
});

TodoItem.displayName = "TodoItem";

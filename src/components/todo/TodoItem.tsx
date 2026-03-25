"use client";
import { CheckCircle2 } from "lucide-react";
import type { Todo, Workspace } from "@/types";
import { COLORS } from "@/constants/theme";
import { getRelativeDateLabel } from "@/utils/date";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";
import styles from "./TodoItem.module.scss";

interface TodoItemProps {
  item: Todo;
  currentWorkspace: Workspace | null;
  onToggle: (id: string) => void;
  onPress: (id: string) => void;
}

export const TodoItem = ({ item, currentWorkspace, onToggle, onPress }: TodoItemProps) => {
  const assignee = currentWorkspace?.members?.find((m) => m.id === item.assigneeId);
  const dateLabel = getRelativeDateLabel(item.endDate);

  return (
    <div className={[styles.item, item.isCompleted ? styles.itemDone : ""].join(" ")}>
      <button onClick={() => onToggle(item.id)} className={styles.toggleButton}>
        {item.isCompleted ? (
          <CheckCircle2
            size={26}
            color={item.color || COLORS.primary}
            fill={(item.color || COLORS.primary) + "40"}
          />
        ) : (
          <div
            className={styles.circle}
            style={{ borderColor: item.color || COLORS.border }}
          />
        )}
      </button>

      <button onClick={() => onPress(item.id)} className={styles.contentButton}>
        <div className={styles.titleRow}>
          <p className={[styles.title, item.isCompleted && styles.titleDone].filter(Boolean).join(" ")}>
            {item.title}
          </p>
          {item.isCompleted && <span className={styles.doneBadge}>완료</span>}
        </div>
        <p className={styles.dateLabel}>{dateLabel}</p>
      </button>

      {assignee && <ProfileAvatar uri={assignee.avatar} name={assignee.name} size={28} />}
    </div>
  );
};

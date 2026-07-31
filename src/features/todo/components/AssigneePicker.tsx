"use client";
import { Users, Check } from "lucide-react";

import { ProfileImage } from "@/components/ui/ProfileImage";
import { cx } from "@/utils/cn";

import styles from "./AssigneePicker.module.scss";

import type { WorkspaceMember } from "@/features/workspace/types/workspace";

interface AssigneePickerProps {
  members: WorkspaceMember[];
  assigneeId?: string;
  /** 담당자 선택 핸들러. 공통(미지정) 선택 시 undefined를 전달한다 */
  onSelect: (assigneeId: string | undefined) => void;
}

export const AssigneePicker = ({ members, assigneeId, onSelect }: AssigneePickerProps) => {
  const isCommon = assigneeId === undefined; // 공통(담당자 미지정) 여부

  return (
    <div className={styles.assigneeRow}>
      <button onClick={() => onSelect(undefined)} className={styles.assigneeOption}>
        <div
          className={cx(
            styles.assigneeIcon,
            isCommon ? styles.assigneeIconActive : styles.assigneeIconInactive
          )}
        >
          <Users size={22} color={isCommon ? "var(--white)" : "var(--grey-500)"} />
        </div>
        <span
          className={cx(
            styles.assigneeLabel,
            isCommon ? styles.assigneeLabelActive : styles.assigneeLabelInactive
          )}
        >
          공통
        </span>
      </button>

      {members.map((member) => {
        const isActive = assigneeId === member.id;
        return (
          <button
            key={member.id}
            onClick={() => onSelect(member.id)}
            className={styles.assigneeOption}
          >
            <div className={styles.memberWrap}>
              <div className={isActive ? styles.memberAvatarActive : undefined}>
                <ProfileImage uri={member.avatar} name={member.name} size={56} />
              </div>
              {isActive && (
                <div className={styles.checkBadge}>
                  <Check size={10} strokeWidth={3} />
                </div>
              )}
            </div>
            <span
              className={cx(
                styles.assigneeLabel,
                isActive ? styles.assigneeLabelActive : styles.assigneeLabelInactive
              )}
            >
              {member.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

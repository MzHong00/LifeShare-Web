"use client";
import { ProfileImage } from "@/components/ui/ProfileImage";

import styles from "./MemberListContent.module.scss";

import type { WorkspaceMember } from "@/features/workspace/types/workspace";

const AVATAR_SIZE = 36; // 멤버 아바타 크기(px) — 컴팩트한 리스트 밀도 유지

interface MemberListContentProps {
  members: WorkspaceMember[];
}

// 참여자 목록 모달에 표시되는 멤버 리스트 UI
export const MemberListContent = ({ members }: MemberListContentProps) => {
  if (members.length === 0) {
    return <p className={styles.empty}>참여자가 없어요</p>;
  }

  return (
    <ul className={styles.list}>
      {members.map((member) => (
        <li key={member.id} className={styles.row}>
          <span className={styles.avatarRing}>
            <ProfileImage uri={member.avatar} name={member.name} size={AVATAR_SIZE} />
          </span>
          <div className={styles.info}>
            <p className={styles.name}>{member.name}</p>
            <p className={styles.email}>{member.email}</p>
          </div>
        </li>
      ))}
    </ul>
  );
};

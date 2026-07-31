"use client";
import { memo } from "react";

import { ProfileImage } from "@/components/ui/ProfileImage";
import { PARTNER_AVATAR_SIZE } from "@/features/chat/constants/chat";

import styles from "./ChatHeader.module.scss";

import type { WorkspaceMember } from "@/features/workspace/types/workspace";

interface ChatHeaderProps {
  partners: WorkspaceMember[]; // 나를 제외한 워크스페이스 멤버 전원
}

// 입력바 텍스트 변경 등 부모(ChatView) 리렌더 시 props 참조가 그대로면 재렌더를 건너뛴다
// GNB 최상위 탭 페이지이므로 서브 페이지 패턴(뒤로가기)이 아닌, 다른 탭과 동일한 프레임리스 헤더로 구성
const ChatHeaderComponent = ({ partners }: ChatHeaderProps) => {
  // 2명 이상이면 "첫 멤버 외 N명"으로 요약 표시
  const title =
    partners.length > 1 ? `${partners[0]?.name} 외 ${partners.length - 1}명` : partners[0]?.name;

  return (
    <header className={styles.header}>
      <div className={styles.headerInfo}>
        <div className={styles.avatarStack}>
          {partners.map((partner) => (
            <div key={partner.id} className={styles.stackedAvatar}>
              <ProfileImage uri={partner.avatar} name={partner.name} size={PARTNER_AVATAR_SIZE} />
            </div>
          ))}
        </div>
        <p className={styles.partnerName}>{title}</p>
      </div>
    </header>
  );
};

export const ChatHeader = memo(ChatHeaderComponent);
ChatHeader.displayName = "ChatHeader";

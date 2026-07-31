import { memo } from "react";

import { ProfileImage } from "@/components/ui/ProfileImage";
import { cx } from "@/utils/cn";
import { AVATAR_FALLBACK_NAME, BUBBLE_AVATAR_SIZE } from "@/features/chat/constants/chat";

import styles from "./MessageBubble.module.scss";

import type { ChatMessage } from "@/features/chat/types/chat";

interface MessageBubbleProps {
  text: string;
  sender: ChatMessage["sender"];
  time: string;
  avatar?: string;
  name?: string;
  isFirstInGroup: boolean; // 같은 발신자·같은 분 묶음의 첫 메시지인지(상대 아바타·이름 표시 기준)
  isLastInGroup: boolean; // 같은 발신자·같은 분 묶음의 마지막 메시지인지(시간 표시 기준)
}

// 새 메시지 도착 시 목록 배열 참조가 바뀌어도 기존 버블은 props 동일 시 리렌더를 건너뛴다
const MessageBubbleComponent = ({
  text,
  sender,
  time,
  avatar,
  name,
  isFirstInGroup,
  isLastInGroup,
}: MessageBubbleProps) => {
  const isMe = sender === "me";

  if (isMe) {
    return (
      <div className={cx(styles.rowMe, !isFirstInGroup && styles.rowGrouped)}>
        <div className={styles.innerMe}>
          {isLastInGroup && <span className={styles.time}>{time}</span>}
          <div className={styles.bubbleMe}>
            <p className={styles.text}>{text}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cx(styles.rowPartner, !isFirstInGroup && styles.rowGrouped)}>
      <div className={styles.avatarSlot}>
        {isFirstInGroup && (
          <ProfileImage
            uri={avatar}
            name={name || AVATAR_FALLBACK_NAME}
            size={BUBBLE_AVATAR_SIZE}
            className={styles.partnerAvatar}
          />
        )}
      </div>
      <div className={styles.innerPartner}>
        <div className={styles.bubblePartner}>
          <p className={cx(styles.text, styles.textPartner)}>{text}</p>
        </div>
        {isLastInGroup && <span className={styles.time}>{time}</span>}
      </div>
    </div>
  );
};

export const MessageBubble = memo(MessageBubbleComponent);
MessageBubble.displayName = "MessageBubble";

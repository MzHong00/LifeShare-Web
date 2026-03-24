import { ProfileAvatar } from "@/components/common/ProfileAvatar";
import styles from "./MessageBubble.module.scss";

interface MessageBubbleProps {
  text: string;
  sender: "me" | "partner";
  time: string;
  avatar?: string;
  name?: string;
}

export const MessageBubble = ({ text, sender, time, avatar, name }: MessageBubbleProps) => {
  const isMe = sender === "me";

  if (isMe) {
    return (
      <div className={styles.rowMe}>
        <div className={styles.innerMe}>
          <span className={styles.time}>{time}</span>
          <div className={styles.bubbleMe}>
            <p className={styles.text}>{text}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.rowPartner}>
      <ProfileAvatar uri={avatar} name={name || "?"} size={32} className={styles.partnerAvatar} />
      <div className={styles.innerPartner}>
        <div className={styles.bubblePartner}>
          <p className={`${styles.text} ${styles.textPartner}`}>{text}</p>
        </div>
        <span className={styles.time}>{time}</span>
      </div>
    </div>
  );
};

"use client";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { useUserStore } from "@/stores/useUserStore";
import { ProfileImage } from "@/components/common/ProfileImage";
import { Card } from "@/components/common/Card";
import styles from "./RecentChat.module.scss";

// 임시 최근 메시지 — 실제 연동 시 채팅 스토어에서 가져온다
const LAST_MESSAGE = {
  text: "좋아! 7시에 역 앞에서 만나",
  time: "오후 2:33",
  sender: "partner",
  unreadCount: 3,
};

export const RecentChat = () => {
  const router = useRouter();
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const user = useUserStore((s) => s.user);

  const partner =
    currentWorkspace?.members?.find((m) => m.id !== user?.id) ??
    currentWorkspace?.members?.[0];

  // 안읽은 메시지가 없거나 파트너가 없으면 렌더링하지 않는다
  if (!partner || !LAST_MESSAGE.unreadCount) return null;

  return (
    <div className={styles.section}>
      <button
        onClick={() => router.push("/chat")}
        className={styles.cardButton}
      >
        <Card className={styles.card}>
          <ProfileImage uri={partner.avatar} name={partner.name} size={48} />
          <div className={styles.content}>
            <div className={styles.topRow}>
              <span className={styles.partnerName}>{partner.name}</span>
              <span className={styles.time}>{LAST_MESSAGE.time}</span>
            </div>
            <p className={styles.lastMessage}>
              {LAST_MESSAGE.sender !== "partner" && "나: "}
              {LAST_MESSAGE.text}
            </p>
          </div>
          <div className={styles.badge}>
            {LAST_MESSAGE.unreadCount > 99 ? "99+" : LAST_MESSAGE.unreadCount}
          </div>
        </Card>
      </button>
    </div>
  );
};

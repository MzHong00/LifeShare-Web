"use client";
import { UserPlus, Copy } from "lucide-react";

import styles from "./WorkspaceSetupView.module.scss";

import type { RoomType } from "@/features/workspace/types/workspace";

interface SetupInviteStepProps {
  workspaceName: string; // 생성된 워크스페이스 이름
  roomType: RoomType; // 생성된 워크스페이스 유형 (문구 분기용)
  inviteCode: string; // 생성된 초대 코드
  /** 초대 링크 복사 핸들러 */
  onCopy: () => void;
}

export const SetupInviteStep = ({
  workspaceName,
  roomType,
  inviteCode,
  onCopy,
}: SetupInviteStepProps) => {
  const inviteeLabel = roomType === "couple" ? "파트너" : "멤버"; // 유형별 초대 대상 명칭

  return (
    <div className={styles.topSection}>
      <div className={styles.iconWrap}>
        <UserPlus size={32} />
      </div>
      <h2 className={styles.heading}>{inviteeLabel} 초대하기</h2>
      <p className={styles.desc}>
        {workspaceName}이(가) 생성되었습니다!{"\n"}아래 초대 코드를 {inviteeLabel}에게{"\n"}
        공유해보세요.
      </p>
      <button type="button" onClick={onCopy} className={styles.inviteCodeBox}>
        <span className={styles.inviteCodeText}>{inviteCode}</span>
        <Copy size={20} />
      </button>
    </div>
  );
};

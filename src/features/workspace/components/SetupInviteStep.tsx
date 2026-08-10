"use client";
import { UserPlus, Copy, Link2 } from "lucide-react";

import styles from "./WorkspaceSetupView.module.scss";

import type { RoomType } from "@/features/workspace/types/workspace";
import { ICON_SIZE } from "@/constants/style";

interface SetupInviteStepProps {
  workspaceName: string; // 생성된 워크스페이스 이름
  roomType: RoomType; // 생성된 워크스페이스 유형 (문구 분기용)
  inviteCode: string; // 발급된 초대 코드 (하이픈 표기)
  /** 초대 코드 복사 핸들러 */
  onCopyCode: () => void;
  /** 초대 링크 복사 핸들러 */
  onCopyLink: () => void;
}

export const SetupInviteStep = ({
  workspaceName,
  roomType,
  inviteCode,
  onCopyCode,
  onCopyLink,
}: SetupInviteStepProps) => {
  const inviteeLabel = roomType === "couple" ? "파트너" : "멤버"; // 유형별 초대 대상 명칭

  return (
    <div className={styles.topSection}>
      <div className={styles.iconWrap}>
        <UserPlus size={ICON_SIZE["2xl"]} />
      </div>
      <h2 className={styles.heading}>{inviteeLabel} 초대하기</h2>
      <p className={styles.desc}>
        {workspaceName}이(가) 생성되었습니다!{"\n"}아래 초대 코드를 {inviteeLabel}에게{"\n"}
        공유해보세요.
      </p>

      <div className={styles.inviteCodeBox}>
        <span className={styles.inviteCodeText}>{inviteCode}</span>
      </div>

      <div className={styles.inviteActions}>
        <button type="button" onClick={onCopyCode} className={styles.inviteActionButton}>
          <Copy size={ICON_SIZE.md} />
          코드 복사
        </button>
        <button type="button" onClick={onCopyLink} className={styles.inviteActionButton}>
          <Link2 size={ICON_SIZE.md} />
          링크 복사
        </button>
      </div>
    </div>
  );
};

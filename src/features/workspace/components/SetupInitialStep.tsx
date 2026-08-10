"use client";
import { Users, Plus } from "lucide-react";

import { APP_WORKSPACE } from "@/constants/config";
import { ICON_SIZE } from "@/constants/style";
import styles from "./WorkspaceSetupView.module.scss";

interface SetupInitialStepProps {
  /** "새로운 워크스페이스 만들기" 버튼 클릭 핸들러 */
  onStart: () => void;
}

export const SetupInitialStep = ({ onStart }: SetupInitialStepProps) => (
  <div className={styles.stepContent}>
    <div className={styles.topSection}>
      <div className={styles.iconWrap}>
        <Users size={ICON_SIZE["2xl"]} />
      </div>
      <h2 className={styles.heading}>{APP_WORKSPACE.KR} 만들기</h2>
      <p className={styles.desc}>
        우리만의 새로운 {APP_WORKSPACE.KR}을 만들고{"\n"}파트너를 초대하여 일상과 기록을 공유하세요.
      </p>
    </div>
    <div className={styles.bottomSection}>
      <button onClick={onStart} className={styles.primaryButton}>
        <Plus size={ICON_SIZE.lg} />
        새로운 {APP_WORKSPACE.KR} 만들기
      </button>
    </div>
  </div>
);

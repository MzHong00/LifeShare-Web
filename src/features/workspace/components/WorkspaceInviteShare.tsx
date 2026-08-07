"use client";
import { Copy, Link2, RefreshCw } from "lucide-react";

import { useInviteShare } from "@/features/workspace/hooks/useInviteShare";
import styles from "./WorkspaceInviteShare.module.scss";

interface WorkspaceInviteShareProps {
  workspaceId: string; // 초대 코드를 공유할 워크스페이스 id
}

/** 초대 코드를 보여주고 코드/링크 복사·재발급을 제공하는 공유 패널 (설정 화면 모달 본문) */
export const WorkspaceInviteShare = ({ workspaceId }: WorkspaceInviteShareProps) => {
  const { displayCode, isPending, isRegenerating, copyCode, copyLink, regenerate } =
    useInviteShare(workspaceId);

  return (
    <div className={styles.container}>
      <p className={styles.help}>
        초대 코드를 알려주거나 링크를 공유해주세요.{"\n"}
        받은 사람은 코드를 직접 입력해 참여할 수도 있습니다.
      </p>

      <div className={styles.codeBox}>
        {isPending && <span className={styles.codePlaceholder}>불러오는 중...</span>}
        {!isPending && !displayCode && (
          <span className={styles.codePlaceholder}>발급된 코드가 없습니다</span>
        )}
        {!isPending && !!displayCode && <span className={styles.codeText}>{displayCode}</span>}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          onClick={copyCode}
          disabled={!displayCode}
          className={styles.actionButton}
        >
          <Copy size={16} />
          코드 복사
        </button>
        <button
          type="button"
          onClick={copyLink}
          disabled={!displayCode}
          className={styles.actionButton}
        >
          <Link2 size={16} />
          링크 복사
        </button>
      </div>

      <button
        type="button"
        onClick={regenerate}
        disabled={isRegenerating}
        className={styles.regenerateButton}
      >
        <RefreshCw size={14} />
        {displayCode ? "코드 재발급" : "코드 발급"}
      </button>
    </div>
  );
};

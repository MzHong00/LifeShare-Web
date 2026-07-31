"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, User } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { APP_WORKSPACE } from "@/constants/config";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import styles from "./WorkspaceLandingView.module.scss";

export const WorkspaceLandingView = () => {
  const router = useRouter();
  const { workspaces, isPending, isError } = useCurrentWorkspace();

  const [inviteCode, setInviteCode] = useState(""); // 입력한 초대 코드

  // 이미 참여 중인 라이프룸이 있으면 홈으로 되돌린다 (빈 상태 오노출 방지)
  useEffect(() => {
    if (!isPending && workspaces.length > 0) {
      router.replace(ROUTES.HOME.path);
    }
  }, [isPending, workspaces.length, router]);

  /** 입력한 초대 코드로 참여 화면으로 이동한다 */
  const handleJoinByCode = () => {
    const code = inviteCode.trim();
    if (!code) return;
    router.push(ROUTES.WORKSPACE.join(code));
  };

  // 로딩 중이거나 워크스페이스가 있으면 빈 상태를 노출하지 않는다
  if (isPending || workspaces.length > 0) return null;

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <button onClick={() => router.push(ROUTES.PROFILE.path)} className={styles.profileButton}>
          <div className={styles.profileInner}>
            <User size={22} />
          </div>
        </button>
      </div>

      <div className={styles.content}>
        {isError ? (
          <p className={styles.errorText}>라이프룸 정보를 불러오지 못했습니다.</p>
        ) : (
          <>
            <div className={styles.logoWrap}>
              <Heart size={40} fill="var(--primary)" color="var(--primary)" />
            </div>

            <div className={styles.textCenter}>
              <h2 className={styles.heading}>
                함께하는 {APP_WORKSPACE.KR}이{"\n"}비어있어요
              </h2>
              <p className={styles.desc}>
                우리만의 소중한 기록을 담을{"\n"}첫 번째 {APP_WORKSPACE.KR}을 만들어볼까요?
              </p>
            </div>

            <button
              onClick={() => router.push(ROUTES.WORKSPACE.SETUP.path)}
              className={styles.ctaButton}
            >
              새로운 {APP_WORKSPACE.KR} 만들기
            </button>

            <div className={styles.codeJoin}>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="초대 코드 입력"
                className={styles.codeInput}
              />
              <button
                onClick={handleJoinByCode}
                className={styles.codeButton}
                disabled={!inviteCode.trim()}
              >
                참여하기
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

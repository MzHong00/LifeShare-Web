"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { ROUTES } from "@/constants/routes";
import { authQueries } from "@/features/auth/queries/authQueries";
import { workspaceActions } from "@/features/workspace/stores/useWorkspaceStore";
import { workspaceQueries } from "@/features/workspace/queries/workspaceQueries";
import { useJoinWorkspaceMutation } from "@/features/workspace/queries/workspaceMutations";
import styles from "./WorkspaceJoinView.module.scss";

export const WorkspaceJoinView = () => {
  const router = useRouter();
  const { code } = useParams<{ code: string }>();
  const { data: user } = useQuery(authQueries.user());
  const { data: workspace, isPending, isError } = useQuery(workspaceQueries.byInviteCode(code));
  const joinWorkspace = useJoinWorkspaceMutation();

  const [joinError, setJoinError] = useState(""); // 참여 실패 메시지

  /** 워크스페이스에 참여한다. 비로그인 시 로그인 후 복귀하도록 리다이렉트한다 */
  const handleJoin = async () => {
    if (!user || !workspace) {
      router.push(ROUTES.LOGIN.query({ redirect: ROUTES.WORKSPACE.join(code) }));
      return;
    }
    try {
      const joined = await joinWorkspace.mutateAsync({ workspaceId: workspace.id });
      workspaceActions.setCurrentWorkspaceId(joined.id);
      router.replace(ROUTES.HOME.path);
    } catch {
      setJoinError("참여 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  const errorMsg = joinError || "초대 정보를 불러오는 중 오류가 발생했습니다.";
  const hasError = !!joinError || isError || (!isPending && !workspace);

  return (
    <main className={styles.main}>
      <div className={styles.logo}>
        <Heart size={48} fill="var(--primary)" />
      </div>

      {isPending && <p className={styles.statusText}>초대 확인 중...</p>}

      {!isPending && !hasError && workspace && (
        <>
          <div className={styles.previewText}>
            <h1 className={styles.title}>{workspace.name}</h1>
            <p className={styles.desc}>라이프룸에 초대받았습니다.{"\n"}함께 기억을 쌓아보세요.</p>
          </div>
          <button
            onClick={handleJoin}
            className={styles.joinButton}
            disabled={joinWorkspace.isPending}
          >
            {user ? "참여하기" : "로그인 후 참여하기"}
          </button>
        </>
      )}

      {joinWorkspace.isPending && <p className={styles.statusText}>참여 중...</p>}

      {hasError && (
        <>
          <p className={styles.errorText}>{errorMsg}</p>
          <button onClick={() => router.replace(ROUTES.HOME.path)} className={styles.homeButton}>
            홈으로 돌아가기
          </button>
        </>
      )}
    </main>
  );
};

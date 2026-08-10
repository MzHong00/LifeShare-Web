"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { ROUTES } from "@/constants/routes";
import { APP_WORKSPACE } from "@/constants/config";
import { authQueries } from "@/features/auth/queries/authQueries";
import { workspaceActions } from "@/features/workspace/stores/useWorkspaceStore";
import { workspaceQueries } from "@/features/workspace/queries/workspaceQueries";
import { useJoinWorkspaceMutation } from "@/features/workspace/queries/workspaceMutations";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { normalizeInviteCode } from "@/features/workspace/utils/inviteCode";
import { ICON_SIZE } from "@/constants/style";
import styles from "./WorkspaceJoinView.module.scss";

/** 초대 링크(/workspace/join/[code])로 들어온 사용자가 참여를 확정하는 화면 */
export const WorkspaceJoinView = () => {
  const router = useRouter();
  const { code } = useParams<{ code: string }>();
  const { data: user } = useQuery(authQueries.user());
  const { workspaces } = useCurrentWorkspace();
  const joinWorkspace = useJoinWorkspaceMutation();

  const [joinError, setJoinError] = useState(""); // 참여 실패 메시지

  const inviteCode = normalizeInviteCode(code); // 링크의 코드도 대소문자·하이픈 표기를 흡수한다
  const {
    data: workspace,
    isPending,
    error: lookupError,
  } = useQuery(workspaceQueries.byInviteCode(inviteCode));

  const isAlreadyMember = !!workspace && workspaces.some((ws) => ws.id === workspace.id);

  /** 워크스페이스에 참여한다. 비로그인 시 로그인 후 복귀하도록 리다이렉트한다 */
  const handleJoin = async () => {
    if (!workspace) return;
    if (!user) {
      router.push(ROUTES.LOGIN.query({ redirect: ROUTES.WORKSPACE.join(code) }));
      return;
    }
    try {
      const joined = await joinWorkspace.mutateAsync({ workspaceId: workspace.id, inviteCode });
      workspaceActions.setCurrentWorkspaceId(joined.id);
      router.replace(ROUTES.HOME.path);
    } catch (error) {
      setJoinError(
        error instanceof Error ? error.message : "참여 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    }
  };

  /** 이미 참여 중인 라이프룸이면 참여 대신 해당 라이프룸으로 전환한다 */
  const handleSwitch = () => {
    if (!workspace) return;
    workspaceActions.setCurrentWorkspaceId(workspace.id);
    router.replace(ROUTES.HOME.path);
  };

  // 서버가 만료·미존재를 구분해 내려주므로 그 문구를 그대로 노출한다
  const lookupErrorMessage = lookupError instanceof Error ? lookupError.message : "";
  const errorMessage = joinError || lookupErrorMessage;
  const hasError = !!errorMessage || (!isPending && !workspace);

  return (
    <main className={styles.main}>
      <div className={styles.logo}>
        <Heart size={ICON_SIZE["4xl"]} fill="var(--primary)" />
      </div>

      {isPending && <p className={styles.statusText}>초대 확인 중...</p>}

      {!isPending && !hasError && workspace && (
        <>
          <div className={styles.previewText}>
            <h1 className={styles.title}>{workspace.name}</h1>
            <p className={styles.desc}>
              {isAlreadyMember
                ? `이미 참여 중인 ${APP_WORKSPACE.KR}이에요.`
                : `${APP_WORKSPACE.KR}에 초대받았습니다.\n함께 기억을 쌓아보세요.`}
            </p>
          </div>
          {isAlreadyMember ? (
            <button onClick={handleSwitch} className={styles.joinButton}>
              이 {APP_WORKSPACE.KR}으로 이동
            </button>
          ) : (
            <button
              onClick={handleJoin}
              className={styles.joinButton}
              disabled={joinWorkspace.isPending}
            >
              {joinWorkspace.isPending && "참여 중..."}
              {!joinWorkspace.isPending && (user ? "참여하기" : "로그인 후 참여하기")}
            </button>
          )}
        </>
      )}

      {hasError && (
        <>
          <p className={styles.errorText}>
            {errorMessage || "초대 정보를 불러오는 중 오류가 발생했습니다."}
          </p>
          <button
            onClick={() => router.replace(ROUTES.WORKSPACE.JOIN.path)}
            className={styles.joinButton}
          >
            코드 직접 입력하기
          </button>
          <button onClick={() => router.replace(ROUTES.HOME.path)} className={styles.homeButton}>
            홈으로 돌아가기
          </button>
        </>
      )}
    </main>
  );
};

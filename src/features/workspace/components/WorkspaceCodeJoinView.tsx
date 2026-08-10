"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Heart, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { ROUTES } from "@/constants/routes";
import { APP_WORKSPACE } from "@/constants/config";
import { authQueries } from "@/features/auth/queries/authQueries";
import { workspaceActions } from "@/features/workspace/stores/useWorkspaceStore";
import { workspaceQueries } from "@/features/workspace/queries/workspaceQueries";
import { useJoinWorkspaceMutation } from "@/features/workspace/queries/workspaceMutations";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { ICON_SIZE } from "@/constants/style";
import {
  normalizeInviteCode,
  formatInviteCode,
  isValidInviteCodeFormat,
} from "@/features/workspace/utils/inviteCode";
import styles from "./WorkspaceCodeJoinView.module.scss";

const INVITE_CODE_INPUT_MAX_LENGTH = 9; // 화면 표기 "XXXX-XXXX"의 하이픈 포함 길이
const FORMAT_ERROR_MESSAGE = "초대 코드 8자리를 정확히 입력해주세요.";

/** 초대 코드를 직접 입력해 라이프룸에 참여하는 화면 (링크 없이 코드만 받은 경우의 진입점) */
export const WorkspaceCodeJoinView = () => {
  const router = useRouter();
  const { data: user } = useQuery(authQueries.user());
  const { workspaces } = useCurrentWorkspace();
  const joinWorkspace = useJoinWorkspaceMutation();

  const [inputValue, setInputValue] = useState(""); // 입력창에 보이는 값 (하이픈 포함)
  const [submittedCode, setSubmittedCode] = useState(""); // 조회를 확정한 정규화 코드
  const [errorMessage, setErrorMessage] = useState(""); // 입력창 아래 인라인 에러

  const {
    data: workspace,
    isFetching,
    error: lookupError,
  } = useQuery(workspaceQueries.byInviteCode(submittedCode));

  const isAlreadyMember = !!workspace && workspaces.some((ws) => ws.id === workspace.id);
  const lookupErrorMessage = lookupError instanceof Error ? lookupError.message : "";

  /** 입력값을 대문자·하이픈 표기로 정리해 반영하고, 이전 조회 결과는 초기화한다 */
  const handleChange = (value: string) => {
    setInputValue(formatInviteCode(normalizeInviteCode(value)));
    setSubmittedCode("");
    setErrorMessage("");
  };

  /** 형식을 먼저 검사한 뒤 서버에 코드를 조회한다 (형식 오류는 요청 없이 즉시 안내) */
  const handleSubmit = () => {
    const code = normalizeInviteCode(inputValue);
    if (!isValidInviteCodeFormat(code)) {
      setErrorMessage(FORMAT_ERROR_MESSAGE);
      return;
    }
    setErrorMessage("");
    setSubmittedCode(code);
  };

  /** 조회된 라이프룸에 참여한다. 비로그인 시 로그인 후 이 화면으로 되돌아온다 */
  const handleJoin = async () => {
    if (!workspace) return;
    if (!user) {
      router.push(ROUTES.LOGIN.query({ redirect: ROUTES.WORKSPACE.JOIN.path }));
      return;
    }
    try {
      const joined = await joinWorkspace.mutateAsync({
        workspaceId: workspace.id,
        inviteCode: submittedCode,
      });
      workspaceActions.setCurrentWorkspaceId(joined.id);
      router.replace(ROUTES.HOME.path);
    } catch (error) {
      setErrorMessage(
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

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <button type="button" onClick={() => router.back()} className={styles.backButton}>
          <ChevronLeft size={ICON_SIZE.xl} />
        </button>
      </header>

      <div className={styles.content}>
        <h1 className={styles.title}>초대 코드로 참여하기</h1>
        <p className={styles.desc}>
          전달받은 8자리 초대 코드를 입력해주세요.{"\n"}
          대소문자와 하이픈은 구분하지 않습니다.
        </p>

        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          maxLength={INVITE_CODE_INPUT_MAX_LENGTH}
          placeholder="XXXX-XXXX"
          aria-label="초대 코드"
          className={styles.codeInput}
        />

        {(errorMessage || lookupErrorMessage) && (
          <p role="alert" className={styles.errorText}>
            {errorMessage || lookupErrorMessage}
          </p>
        )}

        {workspace && !isAlreadyMember && (
          <div className={styles.preview}>
            <div className={styles.previewIcon}>
              {workspace.type === "couple" ? (
                <Heart size={ICON_SIZE.lg} />
              ) : (
                <Users size={ICON_SIZE.lg} />
              )}
            </div>
            <div className={styles.previewInfo}>
              <p className={styles.previewName}>{workspace.name}</p>
              <p className={styles.previewLabel}>멤버 {workspace.memberCount}명</p>
            </div>
          </div>
        )}

        {isAlreadyMember && (
          <p className={styles.noticeText}>이미 참여 중인 {APP_WORKSPACE.KR}이에요.</p>
        )}

        {isAlreadyMember ? (
          <button type="button" onClick={handleSwitch} className={styles.submitButton}>
            이 {APP_WORKSPACE.KR}으로 이동
          </button>
        ) : (
          <button
            type="button"
            onClick={workspace ? handleJoin : handleSubmit}
            disabled={!inputValue.trim() || isFetching || joinWorkspace.isPending}
            className={styles.submitButton}
          >
            {isFetching && "확인 중..."}
            {!isFetching && joinWorkspace.isPending && "참여 중..."}
            {!isFetching && !joinWorkspace.isPending && (workspace ? "참여하기" : "코드 확인")}
          </button>
        )}
      </div>
    </main>
  );
};

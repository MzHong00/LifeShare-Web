"use client";
import type { CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Star, Trash2, User, UserPlus, UserMinus } from "lucide-react";

import { authQueries } from "@/features/auth/queries/authQueries";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { useWorkspaceEditActions } from "@/features/workspace/hooks/useWorkspaceEditActions";
import { WorkspaceThemePicker } from "@/features/workspace/components/WorkspaceThemePicker";
import { WorkspaceInviteShare } from "@/features/workspace/components/WorkspaceInviteShare";
import { WORKSPACE_THEME_ACCENT } from "@/features/workspace/constants/theme";
import { workspaceActions } from "@/features/workspace/stores/useWorkspaceStore";
import { modalActions } from "@/stores/useModalStore";
import { toastActions } from "@/stores/useToastStore";
import { AppHeader } from "@/components/layout/AppHeader";
import { DatePicker } from "@/components/ui/DatePicker";
import { ProfileImage } from "@/components/ui/ProfileImage";
import { APP_WORKSPACE } from "@/constants/config";
import { cx } from "@/utils/cn";
import { ICON_SIZE, AVATAR_SIZE } from "@/constants/style";
import styles from "./WorkspaceEditView.module.scss";

const LAST_LEAVE_CONFIRM_PHRASE = "삭제하기"; // 마지막 멤버 나가기(=전체 삭제) 모달에서 그대로 입력해야 진행되는 확인 문구

export const WorkspaceEditView = () => {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId") || "";

  const { data: user } = useQuery(authQueries.user());
  const { workspaces, currentWorkspace } = useCurrentWorkspace();
  const workspace = workspaces.find((ws) => ws.id === workspaceId);
  const { changeName, changeStartDate, changeThemeColor, changeProfileName, kickMember, leave } =
    useWorkspaceEditActions(workspaceId);
  const isMain = workspace?.id === currentWorkspace?.id;

  if (!workspace) return null;

  const members = workspace.members ?? [];
  const isLastMember = members.length <= 1; // 나 혼자면 나가는 순간 라이프룸과 모든 기록이 삭제된다
  const isOwner = members.find((m) => m.id === user?.id)?.role === "owner"; // 초대 발급·내보내기 권한

  /** 이 라이프룸을 메인으로 설정한다 */
  const handleSetAsMain = () => {
    workspaceActions.setCurrentWorkspaceId(workspace.id);
    toastActions.showToast(`'${workspace.name}'이 메인 라이프룸으로 설정되었습니다`, "success");
  };

  /** 라이프룸에서 나간다. 마지막 멤버면 라이프룸과 모든 기록이 함께 삭제되므로 확인 문구를 요구한다 */
  const handleLeaveWorkspace = () => {
    modalActions.showModal({
      type: "confirm",
      title: `${APP_WORKSPACE.KR}에서 나가기`,
      // 이름 길이에 따라 자연 줄바꿈되므로 \n을 넣지 않는다 (넣으면 이름이 길 때 한 글자만 떨어져 나감)
      message: isLastMember
        ? `마지막 멤버라 나가면 '${workspace.name}'의 일정·할 일·스토리·대화가 모두 삭제되며 되돌릴 수 없습니다.`
        : `정말로 '${workspace.name}'에서 나갈까요? 기록된 데이터는 삭제되지 않지만 목록에서 사라집니다.`,
      confirmText: "나가기",
      ...(isLastMember && { confirmPhrase: LAST_LEAVE_CONFIRM_PHRASE }),
      onConfirm: leave,
    });
  };

  /** 텍스트 입력 하나로 구성된 수정 모달을 띄운다 (제목/프로필 이름 수정에서 공용으로 사용) */
  const openTextPromptModal = ({
    title,
    helpText,
    placeholder,
    defaultValue,
    onConfirm,
  }: {
    title: string;
    helpText: string;
    placeholder: string;
    defaultValue: string;
    onConfirm: (value: string) => Promise<void>;
  }) => {
    let input = defaultValue;
    modalActions.showModal({
      type: "confirm",
      title,
      confirmText: "수정하기",
      content: (
        <div className={styles.modalContent}>
          <p className={styles.modalHelp}>{helpText}</p>
          <input
            type="text"
            defaultValue={input}
            autoFocus
            onChange={(e) => {
              input = e.target.value;
            }}
            placeholder={placeholder}
            className={styles.modalInput}
          />
        </div>
      ),
      onConfirm: async () => {
        if (!input.trim()) return;
        await onConfirm(input.trim());
      },
    });
  };

  const openNameEditModal = () =>
    openTextPromptModal({
      title: "라이프룸 제목",
      helpText: "이 공간의 이름을 입력해주세요.",
      placeholder: "제목 입력",
      defaultValue: workspace.name,
      onConfirm: changeName,
    });

  const openStartDateModal = () => {
    let selectedDate = workspace.startDate || "";
    modalActions.showModal({
      type: "confirm",
      title: "함께한 날",
      confirmText: "확인",
      content: (
        <div className={styles.modalContent}>
          <p className={styles.modalHelp}>함께하기 시작한 날짜를 선택해주세요.</p>
          <DatePicker
            initialDate={selectedDate}
            onChangeDate={(date) => {
              selectedDate = date;
            }}
          />
        </div>
      ),
      onConfirm: async () => {
        if (!selectedDate) return;
        await changeStartDate(selectedDate);
      },
    });
  };

  const openProfileEditModal = () => {
    if (!user) return;
    const myMember = workspace.members?.find((m) => m.id === user.id);
    // 프로필 사진은 커스터마이징을 지원하지 않고 항상 전역 프로필(프로필 설정)의 사진을 그대로 보여준다
    const defaultName = myMember?.name || user.name;
    let name = defaultName;
    modalActions.showModal({
      type: "confirm",
      title: "내 활동 프로필 설정",
      confirmText: "수정하기",
      content: (
        <div className={styles.modalContent}>
          <p className={styles.modalHelp}>이 공간에서 사용할 이름을 입력해주세요.</p>
          <div className={styles.profileModalAvatarWrap}>
            <ProfileImage uri={user.profileImage} name={user.name} size={AVATAR_SIZE["5xl"]} />
          </div>
          <input
            type="text"
            defaultValue={name}
            autoFocus
            onChange={(e) => {
              name = e.target.value;
            }}
            placeholder="이름 입력"
            className={styles.modalInput}
          />
        </div>
      ),
      onConfirm: async () => {
        if (!name.trim()) return;
        await changeProfileName(name.trim());
      },
    });
  };

  /** 멤버를 내보내기 전에 확인을 받는다 (되돌리려면 초대 코드를 다시 전달해야 한다) */
  const openKickModal = (userId: string, memberName: string) => {
    modalActions.showModal({
      type: "confirm",
      title: "멤버 내보내기",
      message: `'${memberName}'님을 내보낼까요? 다시 참여하려면 초대 코드가 필요합니다.`,
      confirmText: "내보내기",
      onConfirm: () => kickMember(userId),
    });
  };

  /** 초대 코드/링크 공유 패널을 모달로 띄운다 */
  const openInviteShareModal = () => {
    modalActions.showModal({
      type: "alert",
      title: workspace.type === "couple" ? "파트너 초대하기" : "멤버 초대하기",
      content: <WorkspaceInviteShare workspaceId={workspace.id} />,
      confirmText: "닫기",
    });
  };

  return (
    <div
      className={styles.page}
      style={{ "--item-accent": WORKSPACE_THEME_ACCENT[workspace.themeColor] } as CSSProperties}
    >
      <AppHeader />
      <div className={styles.content}>
        <div className={styles.pageHeader}>
          <span
            className={cx(
              styles.badge,
              workspace.type === "couple" ? styles.badgeCouple : styles.badgeGroup
            )}
          >
            {workspace.type === "couple" ? "커플" : "단체"} {APP_WORKSPACE.KR}
          </span>
          <button onClick={openNameEditModal}>
            <h2 className={styles.workspaceName}>{workspace.name}</h2>
          </button>
        </div>

        <div>
          <p className={styles.sectionLabel}>참여자</p>
          <div className={styles.settingCard}>
            {members.map((member, index) => (
              <div key={member.id}>
                <div className={styles.memberRow}>
                  <ProfileImage uri={member.avatar} name={member.name} size={AVATAR_SIZE.md} />
                  <span className={styles.settingLabel}>{member.name}</span>
                  {member.role === "owner" && <span className={styles.ownerBadge}>방장</span>}
                  {member.id === user?.id && <span className={styles.meBadge}>나</span>}
                  {isOwner && member.id !== user?.id && (
                    <button
                      onClick={() => openKickModal(member.id, member.name)}
                      aria-label={`${member.name} 내보내기`}
                      className={styles.kickButton}
                    >
                      <UserMinus size={ICON_SIZE.md} />
                    </button>
                  )}
                </div>
                {index < members.length - 1 && <div className={styles.divider} />}
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className={styles.sectionLabel}>기본 설정</p>
          <div className={styles.settingCard}>
            <button onClick={openNameEditModal} className={styles.settingRow}>
              <span className={styles.settingLabel}>라이프룸 제목</span>
              <span className={styles.settingValue}>{workspace.name}</span>
              <ChevronRight size={ICON_SIZE.md} color="var(--grey-300)" />
            </button>
            <div className={styles.divider} />
            <button onClick={openStartDateModal} className={styles.settingRow}>
              <span className={styles.settingLabel}>함께한 날</span>
              <span className={styles.settingValue}>{workspace.startDate || "날짜 선택"}</span>
              <ChevronRight size={ICON_SIZE.md} color="var(--grey-300)" />
            </button>
            <div className={styles.divider} />
            <div className={styles.themeRow}>
              <span className={styles.settingLabel}>테마</span>
              <WorkspaceThemePicker value={workspace.themeColor} onChange={changeThemeColor} />
            </div>
          </div>
        </div>

        <div>
          <p className={styles.sectionLabel}>멤버 및 도구</p>
          <div className={styles.settingCard}>
            <button onClick={openProfileEditModal} className={styles.settingRow}>
              <div className={cx(styles.settingIcon, styles.settingIconPrimary)}>
                <User size={ICON_SIZE.lg} />
              </div>
              <span className={styles.settingLabel}>내 활동 프로필 설정</span>
              <ChevronRight size={ICON_SIZE.md} color="var(--grey-300)" />
            </button>
            {isOwner && (
              <>
                <div className={styles.divider} />
                <button onClick={openInviteShareModal} className={styles.settingRow}>
                  <div className={cx(styles.settingIcon, styles.settingIconGreen)}>
                    <UserPlus size={ICON_SIZE.lg} />
                  </div>
                  <span className={styles.settingLabel}>
                    {workspace.type === "couple" ? "파트너 초대하기" : "멤버 초대하기"}
                  </span>
                  <span className={styles.settingValue}>{members.length}명 참여 중</span>
                  <ChevronRight size={ICON_SIZE.md} color="var(--grey-300)" />
                </button>
              </>
            )}
          </div>
        </div>

        <div>
          <p className={styles.sectionLabel}>위험 구역</p>
          <div className={styles.dangerCard}>
            <button onClick={handleLeaveWorkspace} className={styles.dangerRow}>
              <div className={styles.dangerInfo}>
                <p className={styles.dangerTitle}>{APP_WORKSPACE.KR}에서 나가기</p>
                <p className={styles.dangerDesc}>
                  {isLastMember
                    ? "마지막 멤버라 나가면 모든 기록이 삭제됩니다."
                    : "데이터는 유지되지만 리스트에서 사라집니다."}
                </p>
              </div>
              <Trash2 size={ICON_SIZE.lg} color="var(--error)" className={styles.dangerIcon} />
            </button>
          </div>
        </div>

        <p className={styles.footer}>
          각 공간의 설정은 해당 공간에 참여한 멤버들끼리만{"\n"}공유되며 안전하게 보호됩니다.
        </p>
      </div>

      <div className={styles.floatingActionWrap}>
        <button
          type="button"
          onClick={handleSetAsMain}
          disabled={isMain}
          className={styles.setMainButton}
        >
          <Star size={ICON_SIZE.lg} fill={isMain ? "currentColor" : "none"} />
          {isMain ? "이미 메인 라이프룸이에요" : "메인으로 설정"}
        </button>
      </div>
    </div>
  );
};

"use client";
import { useRouter } from "next/navigation";
import { Plus, Users, Heart } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { WORKSPACE_THEME_ACCENT } from "@/features/workspace/constants/theme";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/Card";
import { ProfileImage } from "@/components/ui/ProfileImage";
import { Skeleton } from "@/components/feedback/Skeleton";
import { formatDate, calculateDDay } from "@/utils/date";
import { APP_WORKSPACE } from "@/constants/config";
import styles from "./WorkspaceListView.module.scss";

import type { CSSProperties } from "react";

const SKELETON_CARD_KEYS = ["workspace-skeleton-1", "workspace-skeleton-2"]; // 로딩 스켈레톤 카드 개수(2개)

export const WorkspaceListView = () => {
  const router = useRouter();
  const { workspaces, currentWorkspace, isPending, isError } = useCurrentWorkspace();
  const isEmpty = !isPending && !isError && workspaces.length === 0;

  /** 카드 탭 → 해당 워크스페이스 설정 페이지로 이동한다 (메인 설정은 설정 페이지 하단 버튼에서 처리) */
  const handleGoSettings = (id: string) => {
    router.push(ROUTES.WORKSPACE.EDIT.query({ workspaceId: id }));
  };

  return (
    <div className={styles.page}>
      <AppHeader />

      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>내 라이프룸 목록</h1>
          <p className={styles.description}>참여 중인 라이프룸을 전환하거나 관리할 수 있습니다.</p>
        </div>

        {isPending &&
          SKELETON_CARD_KEYS.map((key) => (
            <Card key={key} className={styles.skeletonCard}>
              <div className={styles.skeletonCardTop}>
                <Skeleton width={48} height={48} radius={16} />
                <div className={styles.skeletonTextGroup}>
                  <Skeleton width="60%" height={16} />
                  <Skeleton width="40%" height={13} />
                </div>
              </div>
              <div className={styles.skeletonMembers}>
                <Skeleton width={24} height={24} radius="50%" />
                <Skeleton width={70} height={12} />
              </div>
            </Card>
          ))}

        {isError && <p className={styles.errorText}>라이프룸 목록을 불러오지 못했습니다.</p>}

        {isEmpty && <p className={styles.errorText}>참여 중인 라이프룸이 없습니다.</p>}

        {!isPending &&
          !isError &&
          workspaces.map((ws) => {
            const isMain = ws.id === currentWorkspace?.id;
            const days = ws.startDate ? calculateDDay(ws.startDate) : null;

            return (
              <Card
                key={ws.id}
                className={styles.workspaceCard}
                style={{ "--item-accent": WORKSPACE_THEME_ACCENT[ws.themeColor] } as CSSProperties}
                onClick={() => handleGoSettings(ws.id)}
              >
                <div className={styles.cardTop}>
                  <div className={styles.wsIcon}>
                    {ws.type === "couple" ? <Heart size={22} /> : <Users size={22} />}
                  </div>
                  <div className={styles.wsInfo}>
                    <div className={styles.nameRow}>
                      <h3 className={styles.wsName}>{ws.name}</h3>
                      {isMain && <span className={styles.mainBadge}>메인</span>}
                    </div>
                    {ws.startDate && (
                      <p className={styles.wsDate}>
                        {formatDate(ws.startDate)} 시작 · {days}일째
                      </p>
                    )}
                  </div>
                </div>

                {!!ws.members?.length && (
                  <div className={styles.cardMembers}>
                    <div className={styles.membersStack}>
                      {[...ws.members].reverse().map((member) => (
                        <div key={member.id} className={styles.memberAvatar}>
                          <ProfileImage uri={member.avatar} name={member.name} size={24} />
                        </div>
                      ))}
                    </div>
                    <span className={styles.wsMember}>멤버 {ws.members.length}명</span>
                  </div>
                )}
              </Card>
            );
          })}

        <button
          type="button"
          onClick={() => router.push(ROUTES.WORKSPACE.SETUP.path)}
          className={styles.addButton}
        >
          <Plus size={18} />새 {APP_WORKSPACE.KR} 만들기
        </button>
      </div>
    </div>
  );
};

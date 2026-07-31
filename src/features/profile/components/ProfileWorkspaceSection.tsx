"use client";
import { useRouter } from "next/navigation";
import { Heart, Users, ChevronRight } from "lucide-react";

import { ProfileImage } from "@/components/ui/ProfileImage";
import { ROUTES } from "@/constants/routes";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";

import styles from "./ProfileWorkspaceSection.module.scss";

import type { Workspace } from "@/features/workspace/types/workspace";

const VISIBLE_WORKSPACE_COUNT = 3; // 목록에 노출할 최대 라이프룸 개수
const MEMBER_AVATAR_SIZE = 22; // 멤버 아바타 미리보기 크기(px)

/** 현재 메인 워크스페이스를 맨 위로 고정하고 나머지는 원래 순서를 유지한다 (안정 정렬) */
const sortWithMainFirst = (workspaces: Workspace[], mainWorkspaceId?: string) =>
  [...workspaces].sort((a, b) => {
    if (a.id === mainWorkspaceId) return -1;
    if (b.id === mainWorkspaceId) return 1;
    return 0;
  });

/** 프로필 하단 "라이프룸" 섹션: 참여 중인 라이프룸 목록을 최대 3개 노출한다 */
export const ProfileWorkspaceSection = () => {
  const router = useRouter();
  const { workspaces, currentWorkspace } = useCurrentWorkspace();

  const visibleWorkspaces = sortWithMainFirst(workspaces, currentWorkspace?.id).slice(
    0,
    VISIBLE_WORKSPACE_COUNT
  );

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>라이프룸</h2>
        <button
          onClick={() => router.push(ROUTES.WORKSPACE.LIST.path)}
          className={styles.moreButton}
        >
          상세보기
          <ChevronRight size={14} />
        </button>
      </div>

      {visibleWorkspaces.length === 0 ? (
        <p className={styles.emptyText}>참여 중인 라이프룸이 없어요</p>
      ) : (
        <div className={styles.listCard}>
          {visibleWorkspaces.map((ws) => {
            const isMain = ws.id === currentWorkspace?.id;
            const members = ws.members ?? [];

            return (
              <button
                key={ws.id}
                className={styles.listRow}
                onClick={() => router.push(ROUTES.WORKSPACE.EDIT.query({ workspaceId: ws.id }))}
              >
                <div className={styles.listLeft}>
                  <div className={styles.listIconWrap}>
                    {ws.type === "couple" ? <Heart size={18} /> : <Users size={18} />}
                  </div>
                  <div className={styles.nameRow}>
                    <span className={styles.listTitle}>{ws.name}</span>
                    {isMain && <span className={styles.mainBadge}>메인</span>}
                  </div>
                </div>

                {members.length > 0 && (
                  <div className={styles.memberStack}>
                    {[...members]
                      .reverse()
                      .slice(0, 3)
                      .map((member) => (
                        <div key={member.id} className={styles.memberAvatar}>
                          <ProfileImage
                            uri={member.avatar}
                            name={member.name}
                            size={MEMBER_AVATAR_SIZE}
                          />
                        </div>
                      ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export { sortWithMainFirst };

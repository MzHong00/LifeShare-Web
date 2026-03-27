"use client";
import { useRouter } from "next/navigation";
import { Plus, Users, Heart, Check, Trash2, Edit3 } from "lucide-react";
import { useWorkspaceStore, workspaceActions } from "@/stores/useWorkspaceStore";
import { modalActions } from "@/stores/useModalStore";
import { toastActions } from "@/stores/useToastStore";
import { AppHeader } from "@/components/common/AppHeader";
import { Card } from "@/components/common/Card";
import { formatDate, calculateDDay } from "@/utils/date";
import { APP_WORKSPACE } from "@/constants/config";
import styles from "./list.module.scss";

const WorkspaceListPage = () => {
  const router = useRouter();
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  const handleSetMain = (id: string) => {
    const workspace = workspaces.find((w) => w.id === id);
    if (workspace) {
      workspaceActions.setCurrentWorkspace(workspace);
      toastActions.showToast(`'${workspace.name}'이 메인 라이프룸으로 설정되었습니다`, "success");
    }
  };

  const handleDelete = (id: string, name: string) => {
    modalActions.showModal({
      type: "confirm",
      title: `${APP_WORKSPACE.KR} 삭제`,
      message: `'${name}'을(를) 삭제하시겠습니까?`,
      confirmText: "삭제",
      onConfirm: () => {
        workspaceActions.removeWorkspace(id);
        toastActions.showToast("라이프룸이 삭제되었습니다", "success");
      },
    });
  };

  return (
    <div className={styles.page}>
      <AppHeader />

      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>내 라이프룸 목록</h1>
          <p className={styles.description}>
            참여 중인 라이프룸을 전환하거나 관리할 수 있습니다.
          </p>
        </div>

        {workspaces.map((ws) => {
          const isMain = ws.id === currentWorkspace?.id;
          const days = ws.startDate ? calculateDDay(ws.startDate) : null;

          return (
            <Card key={ws.id} className={styles.workspaceCard}>
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
                    <p className={styles.wsDate}>{formatDate(ws.startDate)} 시작 · {days}일째</p>
                  )}
                  <p className={styles.wsMember}>멤버 {ws.members?.length || 0}명</p>
                </div>
              </div>

              <div className={styles.cardActions}>
                {!isMain && (
                  <button onClick={() => handleSetMain(ws.id)} className={styles.setMainButton}>
                    <Check size={14} />메인 설정
                  </button>
                )}
                <button
                  onClick={() => router.push(`/workspace/edit?workspaceId=${ws.id}`)}
                  className={styles.settingsButton}
                >
                  <Edit3 size={14} />설정
                </button>
                <button onClick={() => handleDelete(ws.id, ws.name)} className={styles.deleteButton}>
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          );
        })}

        <button onClick={() => router.push("/workspace/setup")} className={styles.addButton}>
          <Plus size={18} />새 {APP_WORKSPACE.KR} 만들기
        </button>
      </div>
    </div>
  );
};

export default WorkspaceListPage;

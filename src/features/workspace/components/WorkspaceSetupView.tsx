"use client";
import { AppHeader } from "@/components/layout/AppHeader";
import { useWorkspaceSetupWizard } from "@/features/workspace/hooks/useWorkspaceSetupWizard";

import { SetupInitialStep } from "./SetupInitialStep";
import { SetupCreateStep } from "./SetupCreateStep";
import { SetupInviteStep } from "./SetupInviteStep";
import styles from "./WorkspaceSetupView.module.scss";

export const WorkspaceSetupView = () => {
  const wizard = useWorkspaceSetupWizard();

  const createStepLabel = wizard.createSubStep === "type" ? "다음" : "시작하기"; // create 단계 버튼 라벨
  const createButtonLabel = wizard.isSaving ? "생성 중..." : createStepLabel; // 저장 중 우선 표시

  return (
    <div className={styles.page}>
      <AppHeader isBackVisible={true} onBack={wizard.goBack} />

      <div className={styles.inner}>
        {wizard.step === "initial" && <SetupInitialStep onStart={wizard.startCreate} />}

        {wizard.step === "create" && (
          <div className={styles.stepContent}>
            <SetupCreateStep
              subStep={wizard.createSubStep}
              roomType={wizard.roomType}
              workspaceName={wizard.workspaceName}
              startDate={wizard.startDate}
              isMain={wizard.isMain}
              onSelectType={wizard.setRoomType}
              onChangeName={wizard.setWorkspaceName}
              onChangeStartDate={wizard.setStartDate}
              onToggleMain={() => wizard.setIsMain(!wizard.isMain)}
            />
            <div className={styles.bottomSection}>
              <button
                onClick={
                  wizard.createSubStep === "type" ? wizard.goToNameStep : wizard.completeCreate
                }
                className={styles.primaryButton}
                disabled={wizard.isSaving}
              >
                {createButtonLabel}
              </button>
              <button onClick={wizard.goBack} className={styles.secondaryButton}>
                이전으로
              </button>
            </div>
          </div>
        )}

        {wizard.step === "invite" && (
          <div className={styles.stepContent}>
            <SetupInviteStep
              workspaceName={wizard.workspaceName}
              roomType={wizard.roomType}
              inviteCode={wizard.inviteCode}
              onCopy={wizard.copyInviteLink}
            />
            <div className={styles.bottomSection}>
              <button onClick={wizard.skipInvite} className={styles.primaryButton}>
                완료하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

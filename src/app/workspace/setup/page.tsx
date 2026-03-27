"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users, Plus, UserPlus, Heart, Mail, Send } from "lucide-react";
import { workspaceActions, useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { modalActions } from "@/stores/useModalStore";
import { APP_WORKSPACE } from "@/constants/config";
import { Checkbox } from "@/components/common/Checkbox";
import { AppHeader } from "@/components/common/AppHeader";
import { getTodayDateString } from "@/utils/date";
import styles from "./setup.module.scss";

type Step = "initial" | "create" | "invite";
type CreateSubStep = "type" | "name";

const WorkspaceSetupContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingWorkspaceId = searchParams.get("workspaceId");

  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const isFirst = workspaces.length === 0;

  const [step, setStep] = useState<Step>(existingWorkspaceId ? "invite" : "initial");
  const [createSubStep, setCreateSubStep] = useState<CreateSubStep>("type");
  const [roomType, setRoomType] = useState<"couple" | "group">("couple");
  const [workspaceName, setWorkspaceName] = useState("");
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [isMain, setIsMain] = useState(true);
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [createdWorkspaceId, setCreatedWorkspaceId] = useState<string | null>(existingWorkspaceId);

  const handleComplete = () => {
    if (!workspaceName.trim()) {
      modalActions.showModal({ type: "alert", title: "알림", message: `${APP_WORKSPACE.KR} 이름을 입력해주세요.` });
      return;
    }
    const id = workspaceActions.createNewWorkspace(workspaceName, roomType, isMain, startDate);
    setCreatedWorkspaceId(id);
    setStep("invite");
  };

  const handleSendInvite = () => {
    if (!inviteeEmail.trim()) {
      modalActions.showModal({ type: "alert", title: "알림", message: "초대할 파트너의 이메일을 입력해주세요." });
      return;
    }
    if (createdWorkspaceId) {
      workspaceActions.sendInvitation(createdWorkspaceId, workspaceName, "user@example.com", inviteeEmail.trim());
      modalActions.showModal({
        type: "alert",
        title: "알림",
        message: "초대가 전송되었습니다.",
        onConfirm: () => router.replace("/home"),
      });
    }
  };

  const handleBack = () => {
    if (step === "create" && createSubStep === "name") {
      setCreateSubStep("type");
    } else if (step === "initial") {
      router.back();
    } else {
      setStep("initial");
      setCreateSubStep("type");
    }
  };

  return (
    <div className={styles.page}>
      <AppHeader showBack={true} onBack={handleBack} />

      <div className={styles.inner}>
        {step === "initial" && (
          <div className={styles.stepContent}>
            <div className={styles.topSection}>
              <div className={styles.iconWrap}><Users size={32} /></div>
              <h2 className={styles.heading}>{APP_WORKSPACE.KR} 만들기</h2>
              <p className={styles.desc}>
                우리만의 새로운 {APP_WORKSPACE.KR}을 만들고{"\n"}파트너를 초대하여 일상과 기록을 공유하세요.
              </p>
            </div>
            <div className={styles.bottomSection}>
              <button onClick={() => setStep("create")} className={styles.primaryButton}>
                <Plus size={20} />새로운 {APP_WORKSPACE.KR} 만들기
              </button>
            </div>
          </div>
        )}

        {step === "create" && (
          <div className={styles.stepContent}>
            <div className={styles.topSection}>
              {createSubStep === "type" ? (
                <>
                  <h2 className={styles.heading}>유형 선택</h2>
                  <p className={styles.desc}>
                    누구와 함께하는 {APP_WORKSPACE.KR}인가요?{"\n"}나중에 변경할 수 없으니 신중히 골라주세요.
                  </p>
                  <div className={styles.typeOptions}>
                    <button
                      onClick={() => setRoomType("couple")}
                      className={[styles.typeButton, roomType === "couple" ? styles.typeButtonActive : styles.typeButtonInactive].filter(Boolean).join(' ')}
                    >
                      <Heart size={24} color={roomType === "couple" ? "#3182F6" : "#8B95A1"} fill={roomType === "couple" ? "#3182F6" : "transparent"} />
                      <span className={[styles.typeLabel, roomType === "couple" ? styles.typeLabelActive : styles.typeLabelInactive].filter(Boolean).join(' ')}>
                        커플 라이프룸
                      </span>
                    </button>
                    <button
                      onClick={() => setRoomType("group")}
                      className={[styles.typeButton, roomType === "group" ? styles.typeButtonActive : styles.typeButtonInactive].filter(Boolean).join(' ')}
                    >
                      <Users size={24} color={roomType === "group" ? "#3182F6" : "#8B95A1"} />
                      <span className={[styles.typeLabel, roomType === "group" ? styles.typeLabelActive : styles.typeLabelInactive].filter(Boolean).join(' ')}>
                        단체 라이프룸
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.formSection}>
                  <h2 className={styles.heading}>이름 설정</h2>
                  <p className={styles.desc}>우리만의 특별한 {APP_WORKSPACE.KR} 이름을{"\n"}지어주세요.</p>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder={`${APP_WORKSPACE.KR} 이름을 입력하세요`}
                    autoFocus
                    className={styles.input}
                  />
                  <p className={styles.fieldLabel}>{roomType === "couple" ? "만난 날짜" : "시작일"}</p>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={styles.input} />
                  <Checkbox
                    label={`메인 ${APP_WORKSPACE.KR}으로 설정`}
                    checked={isFirst || isMain}
                    onPress={() => !isFirst && setIsMain(!isMain)}
                    disabled={isFirst}
                  />
                </div>
              )}
            </div>
            <div className={styles.bottomSection}>
              <button
                onClick={createSubStep === "type" ? () => { setWorkspaceName(""); setCreateSubStep("name"); } : handleComplete}
                className={styles.primaryButton}
              >
                {createSubStep === "type" ? "다음" : "시작하기"}
              </button>
              <button onClick={handleBack} className={styles.secondaryButton}>이전으로</button>
            </div>
          </div>
        )}

        {step === "invite" && (
          <div className={styles.stepContent}>
            <div className={styles.topSection}>
              <div className={styles.iconWrap}><UserPlus size={32} /></div>
              <h2 className={styles.heading}>파트너 초대하기</h2>
              <p className={styles.desc}>
                {workspaceName || "라이프룸"}이(가) 생성되었습니다!{"\n"}파트너의 이메일을 입력하여 초대를 보내보세요.
              </p>
              <div className={styles.emailInputWrap} style={{ marginTop: 40 }}>
                <Mail size={20} style={{ flexShrink: 0 }} />
                <input
                  type="email"
                  value={inviteeEmail}
                  onChange={(e) => setInviteeEmail(e.target.value)}
                  placeholder="파트너의 이메일 주소"
                  className={styles.emailInput}
                />
              </div>
            </div>
            <div className={styles.bottomSection}>
              <button onClick={handleSendInvite} className={styles.primaryButton}>
                <Send size={20} />초대 이메일 보내기
              </button>
              <button onClick={() => router.replace("/home")} className={styles.secondaryButton}>나중에 하기</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const WorkspaceSetupPage = () => {
  return <Suspense><WorkspaceSetupContent /></Suspense>;
};

export default WorkspaceSetupPage;

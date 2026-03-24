"use client";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon } from "lucide-react";
import { useWorkspaceStore, workspaceActions } from "@/stores/useWorkspaceStore";
import { useUserStore } from "@/stores/useUserStore";
import { modalActions } from "@/stores/useModalStore";
import { calculateDDay, formatDate } from "@/utils/date";
import { joinValuesWithDot } from "@/utils/format";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";
import { MOCK_DATA } from "@/constants/mockData";
import styles from "./DDayHero.module.scss";

export const DDayHero = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const user = useUserStore((s) => s.user);

  if (!currentWorkspace || !user) return null;

  const days = currentWorkspace.startDate ? calculateDDay(currentWorkspace.startDate) : 0;
  const backgroundImage = currentWorkspace.backgroundImage;
  const nextEventTitle = MOCK_DATA.workspace.nextEvent.title;
  const nextDDay = MOCK_DATA.workspace.nextEvent.remainingDays;

  const memberNamesString = joinValuesWithDot(currentWorkspace.members, "name", user.name);

  const handleBackgroundChange = () => {
    modalActions.showModal({
      type: "confirm",
      title: "배경 변경",
      message: "새로운 배경 이미지를 선택하시겠습니까?",
      confirmText: "선택하기",
      onConfirm: () => fileInputRef.current?.click(),
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    workspaceActions.updateWorkspaceBackground(currentWorkspace.id, url);
  };

  const handleMembersClick = () => {
    const members = currentWorkspace.members;
    if (!members?.length) return;
    modalActions.showModal({
      type: "alert",
      title: "참여자 목록",
      content: (
        <div style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          {members.map((member) => (
            <div key={member.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <ProfileAvatar uri={member.avatar} name={member.name} size={44} />
              <div>
                <p style={{ fontWeight: 700, color: "var(--grey-900)" }}>{member.name}</p>
                <p style={{ fontSize: 14, color: "var(--grey-500)" }}>{member.email}</p>
              </div>
            </div>
          ))}
        </div>
      ),
      confirmText: "닫기",
    });
  };

  const textColor = backgroundImage ? "white" : "var(--grey-900)";
  const subColor = backgroundImage ? "rgba(255,255,255,0.85)" : "var(--grey-700)";

  const content = (
    <div className={styles.content}>
      <div className={styles.headerRow}>
        <h1 className={styles.workspaceName} style={{ color: textColor }}>
          {currentWorkspace.name}
        </h1>
        <p className={styles.memberNames} style={{ color: subColor }}>
          {memberNamesString}
        </p>
      </div>

      <div className={styles.bottomSection}>
        <button onClick={handleMembersClick} className={styles.membersStack}>
          {currentWorkspace.members?.map((member, index) => (
            <div
              key={member.id}
              className={styles.memberAvatar}
              style={{ marginLeft: index === 0 ? 0 : -10, zIndex: 10 - index }}
            >
              <ProfileAvatar uri={member.avatar} name={member.name} size={32} />
            </div>
          ))}
        </button>

        <div className={styles.dDayRow}>
          <div className={styles.dDayNumber}>
            <span className={styles.dDayValue} style={{ color: textColor }}>{days}</span>
            <span className={styles.dDayUnit} style={{ color: textColor }}>일</span>
          </div>
          <button
            onClick={handleBackgroundChange}
            className={styles.bgButton}
            style={{
              backgroundColor: backgroundImage ? "rgba(255,255,255,0.25)" : "white",
              boxShadow: backgroundImage ? "none" : "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <ImageIcon size={16} color={backgroundImage ? "white" : "var(--grey-500)"} />
          </button>
        </div>

        <button
          onClick={() => router.push("/anniversary")}
          className={styles.eventBadge}
          style={{
            backgroundColor: backgroundImage ? "rgba(255,255,255,0.25)" : "white",
            boxShadow: backgroundImage ? "none" : "0 2px 4px rgba(0,0,0,0.05)",
          }}
        >
          <span className={styles.eventTitle} style={{ color: backgroundImage ? "white" : "var(--grey-700)" }}>
            {nextEventTitle}{" "}
          </span>
          <span className={styles.eventDDay} style={{ color: backgroundImage ? "white" : "var(--primary)" }}>
            D-{nextDDay}
          </span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className={styles.fileInput}
        onChange={handleFileChange}
      />
    </div>
  );

  return (
    <div className={styles.wrapper}>
      {backgroundImage ? (
        <div className={styles.bgRelative}>
          <img src={backgroundImage} alt="background" className={styles.bgImage} />
          <div className={styles.bgOverlay} />
          <div className={styles.bgRelative}>{content}</div>
        </div>
      ) : (
        <div style={{ backgroundColor: "#F2F4F6" }}>{content}</div>
      )}
    </div>
  );
};

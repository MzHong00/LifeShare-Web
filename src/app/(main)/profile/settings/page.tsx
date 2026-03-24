"use client";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/common/AppHeader";
import { Card } from "@/components/common/Card";
import {
  Bell,
  Lock,
  Smartphone,
  ChevronRight,
  LogOut,
  Camera,
  Pencil,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserStore, userActions } from "@/stores/useUserStore";
import { workspaceActions } from "@/stores/useWorkspaceStore";
import { modalActions } from "@/stores/useModalStore";
import { toastActions } from "@/stores/useToastStore";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";
import styles from "./settings.module.scss";

export default function PersonalSettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = useUserStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const userEmail = user?.email || "user@example.com";
  const displayName = user?.name || userEmail.split("@")[0] || "사용자";

  const handleEditName = () => {
    let newName = displayName;
    modalActions.showModal({
      type: "confirm",
      title: "이름 수정",
      confirmText: "변경하기",
      content: (
        <div style={{ padding: "0 8px 8px" }}>
          <input
            defaultValue={displayName}
            onChange={(e) => (newName = e.target.value)}
            placeholder="새 이름을 입력하세요"
            autoFocus
            style={{
              width: "100%",
              height: 56,
              backgroundColor: "var(--grey-100)",
              borderRadius: 16,
              padding: "0 16px",
              fontSize: 16,
              fontWeight: 600,
              color: "var(--grey-900)",
            }}
          />
        </div>
      ),
      onConfirm: () => {
        if (newName.trim()) {
          userActions.updateUser({ name: newName.trim() });
          toastActions.showToast("이름이 성공적으로 변경되었습니다", "success");
        }
      },
    });
  };

  const handleEditPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    userActions.updateUser({ profileImage: url });
    toastActions.showToast("프로필 사진이 변경되었습니다", "success");
  };

  const handleLogout = () => {
    modalActions.showModal({
      type: "confirm",
      title: "로그아웃",
      message: "정말 로그아웃 하시겠어요?",
      onConfirm: () => {
        clearAuth();
        workspaceActions.clearData();
        router.replace("/login");
      },
    });
  };

  const settings = [
    {
      id: "notifications",
      label: "알림 설정",
      description: "푸시 알림 및 메시지 알림",
      icon: <Bell size={20} color="var(--grey-900)" />,
    },
    {
      id: "privacy",
      label: "위치 공유 설정",
      description: "파트너와 위치 공유 여부",
      icon: <Lock size={20} color="var(--grey-900)" />,
    },
    {
      id: "device",
      label: "기기 관리",
      description: "연결된 기기 목록",
      icon: <Smartphone size={20} color="var(--grey-900)" />,
    },
  ];

  return (
    <div className={styles.page}>
      <AppHeader title="설정" transparent />

      <div className={styles.profileSection}>
        <button
          onClick={() => fileInputRef.current?.click()}
          className={styles.avatarButton}
        >
          <ProfileAvatar
            uri={user?.profileImage}
            name={displayName}
            size={80}
          />
          <div className={styles.cameraButton}>
            <Camera size={13} strokeWidth={2.5} />
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className={styles.fileInput}
          onChange={handleEditPhoto}
        />

        <button onClick={handleEditName} className={styles.nameButton}>
          <span className={styles.displayName}>{displayName}</span>
          <Pencil size={14} />
        </button>
        <span className={styles.email}>{userEmail}</span>
      </div>

      <div className={styles.content}>
        <Card className={styles.settingCard}>
          {settings.map((item, index) => (
            <div key={item.id}>
              <button className={styles.settingRow}>
                <div className={styles.settingLeft}>
                  <div className={styles.settingIcon}>{item.icon}</div>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>{item.label}</p>
                    <p className={styles.settingDesc}>{item.description}</p>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--grey-400)" />
              </button>
              <div className={styles.divider} />
            </div>
          ))}
          <button onClick={handleLogout} className={styles.settingRow}>
            <div className={styles.settingLeft}>
              <div
                className={styles.settingIcon}
                style={{ backgroundColor: "rgba(240, 68, 82, 0.1)" }}
              >
                <LogOut size={20} color="var(--error)" />
              </div>
              <div className={styles.settingInfo}>
                <p
                  className={styles.settingLabel}
                  style={{ color: "var(--error)" }}
                >
                  로그아웃
                </p>
                <p className={styles.settingDesc}>
                  현재 기기에서 로그아웃합니다
                </p>
              </div>
            </div>
          </button>
        </Card>
      </div>
    </div>
  );
}

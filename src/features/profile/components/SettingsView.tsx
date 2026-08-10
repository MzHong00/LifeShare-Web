"use client";
import { useRef } from "react";
import { Bell, Lock, ChevronRight, LogOut, Camera, Pencil } from "lucide-react";

import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/Card";
import { ProfileImage } from "@/components/ui/ProfileImage";
import { ICON_SIZE, AVATAR_SIZE } from "@/constants/style";
import { cx } from "@/utils/cn";

import { useProfileUser } from "@/features/profile/hooks/useProfileUser";
import { useProfileSettings } from "@/features/profile/hooks/useProfileSettings";
import { ProfileHeroSkeleton } from "@/features/profile/components/ProfileHeroSkeleton";
import { toastActions } from "@/stores/useToastStore";
import styles from "./SettingsView.module.scss";

import type { ReactNode } from "react";

interface SettingItem {
  id: string; // 항목 고유 키
  label: string; // 표시 라벨
  description: string; // 보조 설명
  icon: ReactNode; // 아이콘 노드
}

const SETTING_ITEMS: SettingItem[] = [
  {
    id: "notifications",
    label: "알림 설정",
    description: "푸시 알림 및 메시지 알림",
    icon: <Bell size={ICON_SIZE.lg} color="var(--grey-900)" />,
  },
  {
    id: "privacy",
    label: "위치 공유 설정",
    description: "파트너와 위치 공유 여부",
    icon: <Lock size={ICON_SIZE.lg} color="var(--grey-900)" />,
  },
];

export const SettingsView = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { user, email, displayName, isLoading, isError } = useProfileUser();
  const { openEditNameModal, changePhoto, confirmLogout } = useProfileSettings();
  // 서버 업로드가 끝나기 전엔 로컬 blob 미리보기가 표시되므로, 이를 업로드 중 상태로 간주한다
  const isUploadingPhoto = !!user?.profileImage?.startsWith("blob:");

  /** 이름 수정 모달을 띄운다 (입력값은 ref로 확인 시점에 읽는다) */
  const handleEditName = () => {
    openEditNameModal(
      displayName,
      <div className={styles.nameInputWrap}>
        <input
          ref={nameInputRef}
          defaultValue={displayName}
          placeholder="새 이름을 입력하세요"
          autoFocus
          className={styles.nameInput}
        />
      </div>,
      () => nameInputRef.current?.value ?? displayName
    );
  };

  /** 아직 구현되지 않은 설정 항목을 안내한다 */
  const handleSettingItemClick = (label: string) => {
    toastActions.showToast(`${label}은(는) 준비 중입니다`, "info");
  };

  return (
    <div className={styles.page}>
      <AppHeader />

      <div className={styles.profileSection}>
        {isLoading ? (
          <ProfileHeroSkeleton />
        ) : isError ? (
          <p className={styles.errorText}>프로필 정보를 불러오지 못했습니다.</p>
        ) : (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className={styles.avatarButton}
            >
              <ProfileImage uri={user?.profileImage} name={displayName} size={AVATAR_SIZE["5xl"]} />
              <div className={styles.cameraButton}>
                <Camera size={ICON_SIZE.sm} strokeWidth={2.5} />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={changePhoto}
            />

            <button onClick={handleEditName} className={styles.nameButton}>
              <span className={styles.displayName}>{displayName}</span>
              <Pencil size={ICON_SIZE.md} />
            </button>
            <span className={styles.email}>{email}</span>
          </>
        )}
      </div>

      <div className={styles.content}>
        <Card className={styles.settingCard}>
          {SETTING_ITEMS.map((item) => (
            <div key={item.id}>
              <button
                className={styles.settingRow}
                onClick={() => handleSettingItemClick(item.label)}
              >
                <div className={styles.settingLeft}>
                  <div className={styles.settingIcon}>{item.icon}</div>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>{item.label}</p>
                    <p className={styles.settingDesc}>{item.description}</p>
                  </div>
                </div>
                <ChevronRight size={ICON_SIZE.lg} color="var(--grey-400)" />
              </button>
              <div className={styles.divider} />
            </div>
          ))}
          <button onClick={confirmLogout} className={styles.settingRow}>
            <div className={styles.settingLeft}>
              <div className={cx(styles.settingIcon, styles.logoutIcon)}>
                <LogOut size={ICON_SIZE.lg} color="var(--error)" />
              </div>
              <div className={styles.settingInfo}>
                <p className={cx(styles.settingLabel, styles.logoutLabel)}>로그아웃</p>
                <p className={styles.settingDesc}>현재 기기에서 로그아웃합니다</p>
              </div>
            </div>
          </button>
        </Card>
      </div>
    </div>
  );
};

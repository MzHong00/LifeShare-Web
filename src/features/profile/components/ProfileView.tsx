"use client";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";

import { ProfileImage } from "@/components/ui/ProfileImage";
import { ICON_SIZE, AVATAR_SIZE } from "@/constants/style";
import { ROUTES } from "@/constants/routes";

import { useProfileUser } from "@/features/profile/hooks/useProfileUser";
import { PROFILE_MENU_ITEMS } from "@/features/profile/constants/profileMenu";
import { APP_VERSION } from "@/features/profile/constants/profile";
import { ProfileWorkspaceSection } from "./ProfileWorkspaceSection";
import { ProfileMenuRow } from "./ProfileMenuRow";
import { ProfileHeroSkeleton } from "./ProfileHeroSkeleton";
import styles from "./ProfileView.module.scss";

/** 프로필 탭 메인 화면(히어로·워크스페이스·알림/지원 메뉴) */
export const ProfileView = () => {
  const router = useRouter();
  const { user, email, displayName, isLoading, isError } = useProfileUser();

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <button
          onClick={() => router.push(ROUTES.PROFILE.SETTINGS.path)}
          className={styles.settingsBtn}
          aria-label="설정"
        >
          <Settings size={ICON_SIZE.lg} />
        </button>
        {isLoading && <ProfileHeroSkeleton />}
        {!isLoading && isError && (
          <p className={styles.errorText}>프로필 정보를 불러오지 못했습니다.</p>
        )}
        {!isLoading && !isError && (
          <>
            <ProfileImage
              uri={user?.profileImage}
              name={displayName}
              size={AVATAR_SIZE["5xl"]}
              className={styles.heroAvatar}
            />
            <h1 className={styles.heroName}>{displayName}</h1>
            <p className={styles.heroEmail}>{email}</p>
          </>
        )}
      </header>

      <ProfileWorkspaceSection />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>알림 및 지원</h2>
        <div className={styles.listCard}>
          {PROFILE_MENU_ITEMS.map((item) => (
            <ProfileMenuRow key={item.id} item={item} />
          ))}
        </div>
      </section>

      <p className={styles.version}>{APP_VERSION}</p>
    </div>
  );
};

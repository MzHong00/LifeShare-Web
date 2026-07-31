import { Skeleton } from "@/components/feedback/Skeleton";

import styles from "./ProfileHeroSkeleton.module.scss";

const AVATAR_SIZE = 84; // 히어로 아바타 스켈레톤 크기(px) — ProfileView HERO_AVATAR_SIZE와 동일
const NAME_WIDTH = 120; // 이름 라인 너비(px)
const NAME_HEIGHT = 22; // 이름 라인 높이(px)
const EMAIL_WIDTH = 160; // 이메일 라인 너비(px)
const EMAIL_HEIGHT = 14; // 이메일 라인 높이(px)

/** 프로필 히어로 영역(아바타·이름·이메일)의 로딩 스켈레톤 */
export const ProfileHeroSkeleton = () => (
  <div className={styles.wrap} aria-hidden="true">
    <Skeleton width={AVATAR_SIZE} height={AVATAR_SIZE} radius="50%" className={styles.avatar} />
    <Skeleton width={NAME_WIDTH} height={NAME_HEIGHT} />
    <Skeleton width={EMAIL_WIDTH} height={EMAIL_HEIGHT} />
  </div>
);

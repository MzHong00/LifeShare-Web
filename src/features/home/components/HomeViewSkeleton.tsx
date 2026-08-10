import { Skeleton } from "@/components/feedback/Skeleton";
import { AVATAR_SIZE } from "@/constants/style";

import styles from "./HomeViewSkeleton.module.scss";

const GREETING_WIDTH = 180; // 인사말 라인 너비(px)
const GREETING_HEIGHT = 22; // 인사말 라인 높이(px) — .greetingLine(19px)의 line-box 근사값
const GREETING_SUB_WIDTH = 150; // 인사말 보조 문구 너비(px)
const GREETING_SUB_HEIGHT = 14; // 인사말 보조 문구 높이(px)
const AVATAR_STACK_KEYS = ["home-skeleton-avatar-1", "home-skeleton-avatar-2"]; // 아바타 스택 자리 개수(2명 기준)
const CARD_RADIUS = 20; // 섹션 카드 모서리 둥글기(px)
const SPOTLIGHT_HEIGHT = 196; // AnniversarySpotlight 카드 높이(px)
const JOURNEY_HEIGHT = 84; // AnniversaryJourney 레일 높이(px)
const DIGEST_HEIGHT = 168; // UpcomingDigest 카드 높이(px)
const DASHBOARD_HEIGHT = 212; // ActivityDashboard 카드 높이(px)

/** 홈 화면(MemoryFeed) 로딩 스켈레톤: 인사말 헤더 + 4개 섹션 카드의 골격을 실제 높이에 맞춰 보여준다 */
export const HomeViewSkeleton = () => (
  <div className={styles.page} aria-hidden="true">
    <div className={styles.content}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <Skeleton width={GREETING_WIDTH} height={GREETING_HEIGHT} />
          <Skeleton width={GREETING_SUB_WIDTH} height={GREETING_SUB_HEIGHT} />
        </div>
        <div className={styles.membersStack}>
          {AVATAR_STACK_KEYS.map((key) => (
            <Skeleton
              key={key}
              width={AVATAR_SIZE.sm}
              height={AVATAR_SIZE.sm}
              radius="50%"
              className={styles.memberAvatar}
            />
          ))}
        </div>
      </div>

      <Skeleton height={SPOTLIGHT_HEIGHT} radius={CARD_RADIUS} />
      <Skeleton height={JOURNEY_HEIGHT} radius={CARD_RADIUS} />
      <Skeleton height={DIGEST_HEIGHT} radius={CARD_RADIUS} />
      <Skeleton height={DASHBOARD_HEIGHT} radius={CARD_RADIUS} />
    </div>
  </div>
);

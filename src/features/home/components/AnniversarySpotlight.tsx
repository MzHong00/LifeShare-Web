"use client";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAnniversaries } from "@/features/anniversary/hooks/useAnniversaries";
import { ICON_SIZE } from "@/constants/style";
import { ROUTES } from "@/constants/routes";
import { formatDate } from "@/utils/date";

import styles from "./AnniversarySpotlight.module.scss";

/** 홈 중앙의 폴라로이드 감성 "함께한 지 N일" 스포트라이트 */
export const AnniversarySpotlight = () => {
  const router = useRouter();
  const { startDate, days } = useAnniversaries();

  if (!startDate) return null;

  return (
    <section className={styles.spotlight}>
      <button
        type="button"
        onClick={() => router.push(ROUTES.ANNIVERSARY.path)}
        className={styles.polaroid}
        aria-label={`함께한 지 ${days}일, 기념일 페이지로 이동`}
      >
        <div className={styles.polaroidInner}>
          <span className={styles.eventLabel}>
            <Sparkles size={ICON_SIZE.sm} className={styles.sparkle} />
            함께한 지
          </span>
          <span className={styles.eventDDay}>{days}일</span>
        </div>
        <span className={styles.polaroidCaption}>
          {formatDate(startDate, "YYYY. MM. DD (ddd)")}부터
        </span>
      </button>
    </section>
  );
};

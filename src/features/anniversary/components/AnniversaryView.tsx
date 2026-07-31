"use client";

import { Heart } from "lucide-react";
import Image from "next/image";

import { AppHeader } from "@/components/layout/AppHeader";
import { formatDate } from "@/utils/date";
import { useAnniversaries } from "@/features/anniversary/hooks/useAnniversaries";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { AnniversaryItem } from "./AnniversaryItem";

import styles from "./AnniversaryView.module.scss";

/** 기념일 화면 — 시작일 히어로 배너와 다가오는 기념일 목록 */
export const AnniversaryView = () => {
  const { startDate, days, anniversaries } = useAnniversaries();
  const { currentWorkspace } = useCurrentWorkspace();

  const heroImage = currentWorkspace?.backgroundImage; // 워크스페이스 배경 이미지 (없으면 그라데이션)

  return (
    <div className={styles.page}>
      <AppHeader />

      <div className={styles.heroSection}>
        <div className={styles.heroCard}>
          {heroImage && (
            <Image
              src={heroImage}
              alt="anniversary hero"
              fill
              sizes="100vw"
              className={styles.heroBgImage}
            />
          )}
          <div className={styles.heroBgOverlay} />
          <div className={styles.heroContent}>
            <div className={styles.heroTopText}>
              <Heart size={20} fill="white" color="white" />
              <p className={styles.heroTitle}>우리의 특별한 날</p>
              <p className={styles.heroSubTitle}>함께한 모든 순간이 소중해요</p>
            </div>
            <div className={styles.heroDaysBadge}>
              <p className={styles.heroStartDate}>
                {startDate ? formatDate(startDate) + " 시작" : "시작일 미설정"}
              </p>
              <p className={styles.heroDays}>
                {days}
                <span className={styles.heroDaysUnit}>일</span>
              </p>
              <p className={styles.heroSub}>함께한 날</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.listSection}>
        <h2 className={styles.listTitle}>다가오는 기념일</h2>
        <div className={styles.list}>
          {anniversaries.map((anniversary) => (
            <AnniversaryItem key={anniversary.id} anniversary={anniversary} />
          ))}
        </div>
      </div>
    </div>
  );
};

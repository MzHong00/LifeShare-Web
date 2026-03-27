"use client";
import { useMemo } from "react";
import { Heart } from "lucide-react";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { AppHeader } from "@/components/common/AppHeader";
import { Card } from "@/components/common/Card";
import { calculateDDay, formatDate } from "@/utils/date";
import { COLORS } from "@/constants/theme";
import dayjs from "dayjs";
import styles from "./anniversary.module.scss";

const generateAnniversaries = (startDate: string) => {
  const start = dayjs(startDate);
  const today = dayjs();
  const anniversaries = [];

  const milestones = [100, 200, 365, 500, 700, 1000, 1100, 1200, 1300, 1500, 2000];
  for (const days of milestones) {
    const date = start.add(days - 1, "day");
    anniversaries.push({
      id: `d-${days}`,
      title: `${days}일`,
      date: date.format("YYYY-MM-DD"),
      daysLeft: date.diff(today, "day"),
      type: "dday",
    });
  }

  for (let year = 1; year <= 5; year++) {
    const date = start.add(year, "year");
    anniversaries.push({
      id: `y-${year}`,
      title: `${year}주년 기념일`,
      date: date.format("YYYY-MM-DD"),
      daysLeft: date.diff(today, "day"),
      type: "yearly",
    });
  }

  return anniversaries.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 12);
};

export default function AnniversaryPage() {
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const days = currentWorkspace?.startDate ? calculateDDay(currentWorkspace.startDate) : 0;

  const anniversaries = useMemo(() => {
    if (!currentWorkspace?.startDate) return [];
    return generateAnniversaries(currentWorkspace.startDate);
  }, [currentWorkspace]);

  return (
    <div className={styles.page}>
      <AppHeader />

      <div className={styles.heroSection}>
        <div className={styles.heroCard}>
          <img
            src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800"
            alt="anniversary hero"
            className={styles.heroBgImage}
          />
          <div className={styles.heroBgOverlay} />
          <div className={styles.heroContent}>
            <div className={styles.heroTopText}>
              <Heart size={20} fill="white" color="white" />
              <p className={styles.heroTitle}>우리의 특별한 날</p>
              <p className={styles.heroSubTitle}>함께한 모든 순간이 소중해요</p>
            </div>
            <div className={styles.heroDaysBadge}>
              <p className={styles.heroStartDate}>
                {currentWorkspace?.startDate ? formatDate(currentWorkspace.startDate) + " 시작" : "시작일 미설정"}
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
          {anniversaries.map((ann) => {
            const isPast = ann.daysLeft < 0;
            const isToday = ann.daysLeft === 0;
            return (
              <Card key={ann.id} className={styles.annCard}>
                <div
                  className={styles.annIcon}
                  style={{
                    backgroundColor: isPast ? COLORS.grey200 : isToday ? COLORS.primary : COLORS.primaryLight,
                  }}
                >
                  <Heart
                    size={20}
                    color={isPast ? COLORS.grey400 : isToday ? "white" : COLORS.primary}
                    fill={isToday ? "white" : "transparent"}
                  />
                </div>
                <div className={styles.annInfo}>
                  <p className={[styles.annTitle, isPast && styles.annTitlePast].filter(Boolean).join(' ')}>{ann.title}</p>
                  <p className={styles.annDate}>{formatDate(ann.date)}</p>
                </div>
                <div className={styles.annStatus}>
                  {isPast ? (
                    <span className={styles.statusPast}>지남</span>
                  ) : isToday ? (
                    <span className={styles.statusToday}>오늘!</span>
                  ) : (
                    <span className={styles.statusDday}>D-{ann.daysLeft}</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { Heart } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { formatDate } from "@/utils/date";
import { cx } from "@/utils/cn";

import styles from "./AnniversaryItem.module.scss";

import type { Anniversary } from "@/features/anniversary/types/anniversary";

interface AnniversaryItemProps {
  anniversary: Anniversary;
}

export const AnniversaryItem = ({ anniversary }: AnniversaryItemProps) => {
  const isPast = anniversary.daysLeft < 0;
  const isToday = anniversary.daysLeft === 0;

  return (
    <Card className={styles.annCard}>
      <div
        className={cx(styles.annIcon, isPast && styles.annIconPast, isToday && styles.annIconToday)}
      >
        <Heart size={20} fill={isToday ? "currentColor" : "transparent"} />
      </div>
      <div className={styles.annInfo}>
        <p className={cx(styles.annTitle, isPast && styles.annTitlePast)}>{anniversary.title}</p>
        <p className={styles.annDate}>{formatDate(anniversary.date)}</p>
      </div>
      <div className={styles.annStatus}>
        {isPast && <span className={styles.statusPast}>지남</span>}
        {isToday && <span className={styles.statusToday}>오늘!</span>}
        {!isPast && !isToday && <span className={styles.statusDday}>D-{anniversary.daysLeft}</span>}
      </div>
    </Card>
  );
};

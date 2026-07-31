import { Heart } from "lucide-react";

import { cx } from "@/utils/cn";

import styles from "./Spinner.module.scss";

interface SpinnerProps {
  size?: number; // 하트 아이콘 크기 (기본: 28)
  className?: string;
}

/** 두 하트가 서로 다른 박자로 숨쉬듯 겹쳐 뛰는 Duous 전용 로딩 스피너 (테마 컬러 토큰 기반) */
export const Spinner = ({ size = 28, className }: SpinnerProps) => (
  <div className={cx(styles.spinner, className)} role="status" aria-label="로딩 중">
    <span className={styles.glow} aria-hidden="true" />
    <Heart size={size} className={cx(styles.heart, styles.heartBack)} aria-hidden="true" />
    <Heart size={size} className={cx(styles.heart, styles.heartFront)} aria-hidden="true" />
  </div>
);

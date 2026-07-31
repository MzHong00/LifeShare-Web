import { cx } from "@/utils/cn";

import styles from "./Skeleton.module.scss";

interface SkeletonProps {
  width?: string | number; // 블록 너비 (기본: 100%)
  height?: string | number; // 블록 높이
  radius?: string | number; // 모서리 둥글기 (기본: 8px)
  className?: string;
}

/** shimmer 애니메이션이 내장된 로딩 플레이스홀더 블록 */
export const Skeleton = ({ width = "100%", height, radius = 8, className }: SkeletonProps) => (
  <div
    className={cx(styles.skeleton, className)}
    style={{ width, height, borderRadius: radius }}
    aria-hidden="true"
  />
);

"use client";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { ICON_SIZE } from "@/constants/iconSize";
import { cx } from "@/utils/cn";

import styles from "./ProfileView.module.scss";

import type { ProfileMenuItem } from "@/features/profile/constants/profileMenu";

interface ProfileMenuRowProps {
  item: ProfileMenuItem; // 렌더링할 메뉴 데이터
}

/** 알림·지원 메뉴 리스트의 단일 행 */
export const ProfileMenuRow = ({ item }: ProfileMenuRowProps) => {
  const router = useRouter();

  return (
    <button
      onClick={() => (item.onClick ? item.onClick() : router.push(item.route ?? ""))}
      className={styles.listRow}
    >
      <div className={styles.listLeft}>
        <div className={cx(styles.listIconWrap, styles[item.colorClass])}>{item.icon}</div>
        <span className={styles.listTitle}>{item.label}</span>
      </div>
      <div className={styles.listRight}>
        <span className={styles.listRightText}>{item.subText}</span>
        <ChevronRight size={ICON_SIZE.md} color="var(--grey-300)" />
      </div>
    </button>
  );
};

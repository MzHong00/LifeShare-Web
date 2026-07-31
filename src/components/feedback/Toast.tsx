"use client";
import { CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

import { useToastStore } from "@/stores/useToastStore";

import styles from "./Toast.module.scss";

/** 토스트 타입별 아이콘 매핑 */
const TOAST_ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

export const Toast = () => {
  const toast = useToastStore((s) => s.toast);

  if (!toast) return null;

  const Icon = TOAST_ICONS[toast.type];

  return (
    <div className={styles.container}>
      <div key={toast.id} className={styles.toast} data-type={toast.type}>
        <span className={styles.iconWrap}>
          <Icon size={16} className={styles.icon} />
        </span>
        <span className={styles.message}>{toast.message}</span>
      </div>
    </div>
  );
};

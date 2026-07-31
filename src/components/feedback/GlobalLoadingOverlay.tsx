"use client";
import { useGlobalLoadingStore } from "@/stores/useGlobalLoadingStore";
import { Spinner } from "@/components/feedback/Spinner";

import styles from "./GlobalLoadingOverlay.module.scss";

/** 앱 전역에서 공용으로 사용하는 로딩 오버레이. useGlobalLoadingStore로 켜고 끈다 */
export const GlobalLoadingOverlay = () => {
  const isLoading = useGlobalLoadingStore((s) => s.isLoading);
  const message = useGlobalLoadingStore((s) => s.message);

  if (!isLoading) return null;

  return (
    <div className={styles.overlay} role="alert" aria-busy="true">
      <div className={styles.backdrop} />
      <div className={styles.content}>
        <Spinner />
        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  );
};

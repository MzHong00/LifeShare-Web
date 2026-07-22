import { AlertCircle } from "lucide-react";

import { ICON_SIZE } from "@/constants/iconSize";
import styles from "./ErrorFallback.module.scss";

interface ErrorFallbackProps {
  desc?: string; // 에러 메시지
  onRetry: () => void; // 재시도(reset) 콜백
}

/** 페이지 단위 Error Boundary(error.tsx)에서 공통으로 쓰는 에러 폴백 UI */
export const ErrorFallback = ({ desc, onRetry }: ErrorFallbackProps) => {
  return (
    <main className={styles.main}>
      <div className={styles.iconBadge}>
        <AlertCircle size={ICON_SIZE["4xl"]} />
      </div>

      <h1 className={styles.title}>문제가 발생했습니다</h1>
      <p className={styles.desc}>
        {desc || "일시적인 오류가 발생했습니다.\n잠시 후 다시 시도해주세요."}
      </p>
      <button onClick={onRetry} className={styles.retryButton}>
        다시 시도
      </button>
    </main>
  );
};

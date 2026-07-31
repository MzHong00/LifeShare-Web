"use client";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { cx } from "@/utils/cn";

import styles from "./AppHeader.module.scss";

interface AppHeaderProps {
  title?: string;
  isBackVisible?: boolean; // 뒤로가기 버튼 노출 여부
  rightElement?: React.ReactNode;
  /** 뒤로가기 클릭 핸들러. 미지정 시 router.back() */
  onBack?: () => void;
  className?: string; // 페이지별 배경 등 스타일 확장용 (기본은 투명)
}

export const AppHeader = ({
  title,
  isBackVisible = true,
  rightElement,
  onBack,
  className,
}: AppHeaderProps) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header className={cx(styles.header, className)}>
      {isBackVisible ? (
        <button onClick={handleBack} className={styles.backButton} aria-label="뒤로 가기">
          <ChevronLeft size={24} />
        </button>
      ) : (
        <div className={styles.placeholder} />
      )}

      {title && <h1 className={styles.title}>{title}</h1>}

      <div className={styles.right}>{rightElement}</div>
    </header>
  );
};

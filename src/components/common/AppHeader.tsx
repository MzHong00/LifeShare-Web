"use client";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import styles from "./AppHeader.module.scss";

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  onBack?: () => void;
  transparent?: boolean;
}

export const AppHeader = ({
  title,
  showBack = true,
  rightElement,
  onBack,
  transparent = true,
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
    <header className={[styles.header, transparent && styles.transparent].filter(Boolean).join(" ")}>
      {showBack ? (
        <button onClick={handleBack} className={styles.backButton}>
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

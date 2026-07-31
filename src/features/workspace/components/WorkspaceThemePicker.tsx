"use client";
import { cx } from "@/utils/cn";
import styles from "./WorkspaceThemePicker.module.scss";

import type { ThemeColor } from "@/features/workspace/types/workspace";

interface WorkspaceThemePickerProps {
  value: ThemeColor;
  onChange: (themeColor: ThemeColor) => void;
}

const THEME_OPTIONS: { value: ThemeColor; label: string }[] = [
  { value: "pink", label: "핑크 오로라" },
  { value: "blue", label: "블루 오로라" },
  { value: "twilight", label: "트와일라잇 오로라" },
  { value: "yellow", label: "옐로 오로라" },
  { value: "green", label: "그린 오로라" },
];

// 테마별 카드 스타일 매핑
const CARD_STYLES: Record<ThemeColor, string> = {
  pink: styles.cardPink,
  blue: styles.cardBlue,
  twilight: styles.cardTwilight,
  yellow: styles.cardYellow,
  green: styles.cardGreen,
};

export const WorkspaceThemePicker = ({ value, onChange }: WorkspaceThemePickerProps) => {
  return (
    <div className={styles.picker}>
      {THEME_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            data-theme={option.value}
            onClick={() => onChange(option.value)}
            className={cx(
              styles.card,
              CARD_STYLES[option.value],
              isSelected && styles.cardSelected
            )}
            aria-label={option.label}
          >
            {/* 앱 오로라 배경과 동일한 색감의 그라데이션 미리보기 (선택 표시는 카드 테두리로) */}
            <div className={styles.swatch} />
          </button>
        );
      })}
    </div>
  );
};

"use client";
import { Check } from "lucide-react";

import { cx } from "@/utils/cn";
import { ICON_SIZE } from "@/constants/style";

import styles from "./Checkbox.module.scss";

interface CheckboxProps {
  label: string;
  isChecked: boolean; // 체크 여부
  /** 체크 토글 핸들러 */
  onPress: () => void;
  isDisabled?: boolean; // 비활성화 여부
  className?: string;
}

/** 라벨이 있는 체크박스 버튼 */
export const Checkbox = ({ label, isChecked, onPress, isDisabled, className }: CheckboxProps) => {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={isDisabled}
      className={cx(styles.checkbox, className)}
    >
      <div
        className={cx(styles.box, isChecked && styles.boxChecked, isDisabled && styles.boxDisabled)}
      >
        {isChecked && <Check size={ICON_SIZE.md} color="var(--white)" strokeWidth={3} />}
      </div>
      <span className={cx(styles.label, isDisabled && styles.labelDisabled)}>{label}</span>
    </button>
  );
};

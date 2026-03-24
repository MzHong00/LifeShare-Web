"use client";
import { Check } from "lucide-react";
import styles from "./Checkbox.module.scss";

interface CheckboxProps {
  label: string;
  checked: boolean;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
}

export const Checkbox = ({
  label,
  checked,
  onPress,
  disabled,
  className,
}: CheckboxProps) => {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className={[styles.checkbox, className].filter(Boolean).join(' ')}
    >
      <div
        className={[
          styles.box,
          checked && styles.boxChecked,
          disabled && styles.boxDisabled
        ].filter(Boolean).join(' ')}
      >
        {checked && <Check size={14} color="#ffffff" strokeWidth={3} />}
      </div>
      <span className={[styles.label, disabled && styles.labelDisabled].filter(Boolean).join(' ')}>
        {label}
      </span>
    </button>
  );
};

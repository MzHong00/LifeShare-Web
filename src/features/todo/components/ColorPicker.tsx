"use client";
import { cx } from "@/utils/cn";
import { TODO_COLORS } from "@/constants/theme";

import styles from "./ColorPicker.module.scss";

import type { CSSProperties } from "react";

interface ColorPickerProps {
  selectedColor: string;
  /** 색상 선택 핸들러 */
  onSelect: (color: string) => void;
}

export const ColorPicker = ({ selectedColor, onSelect }: ColorPickerProps) => {
  return (
    <div className={styles.colorPicker}>
      {TODO_COLORS.map((color) => (
        <button
          key={color}
          onClick={() => onSelect(color)}
          className={cx(styles.colorButton, selectedColor === color && styles.colorButtonSelected)}
          style={{ "--color-button-bg": color } as CSSProperties}
        />
      ))}
    </div>
  );
};

import { cx } from "@/utils/cn";

import styles from "./Card.module.scss";

import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = ({ children, className, onClick, ...props }: CardProps) => {
  return (
    <div
      className={cx(styles.card, !!onClick && styles.clickable, className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

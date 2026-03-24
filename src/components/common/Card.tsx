import { HTMLAttributes } from "react";
import styles from "./Card.module.scss";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = ({ children, className, onClick, ...props }: CardProps) => {
  return (
    <div
      className={[styles.card, onClick && styles.clickable, className].filter(Boolean).join(' ')}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

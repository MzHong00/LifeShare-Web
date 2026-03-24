"use client";
import styles from "./ProfileAvatar.module.scss";

interface ProfileAvatarProps {
  uri?: string;
  name: string;
  size?: number;
  className?: string;
}

const BG_COLORS = [
  "#3182F6",
  "#10b981",
  "#a855f7",
  "#f97316",
  "#ec4899",
  "#6366f1",
];

export const ProfileAvatar = ({
  uri,
  name,
  size = 40,
  className,
}: ProfileAvatarProps) => {
  const initial = name?.charAt(0) || "?";

  if (uri) {
    return (
      <div
        className={[styles.avatar, className].filter(Boolean).join(' ')}
        style={{ width: size, height: size }}
      >
        <img src={uri} alt={name} className={styles.image} />
      </div>
    );
  }

  const colorIndex = name ? name.charCodeAt(0) % BG_COLORS.length : 0;
  const bgColor = BG_COLORS[colorIndex];

  return (
    <div
      className={[styles.fallback, className].filter(Boolean).join(' ')}
      style={{ width: size, height: size, backgroundColor: bgColor }}
    >
      <span className={styles.initial} style={{ fontSize: size * 0.4 }}>
        {initial}
      </span>
    </div>
  );
};

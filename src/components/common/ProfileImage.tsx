"use client";
import { useState } from "react";
import styles from "./ProfileImage.module.scss";

interface ProfileImageProps {
  uri?: string;
  name: string;
  size?: number;
  className?: string;
}

// 이름 첫 글자의 char code로 색상을 결정해 동일 사용자는 항상 같은 색을 갖는다
const BG_COLORS = [
  "#3182F6",
  "#10b981",
  "#a855f7",
  "#f97316",
  "#ec4899",
  "#6366f1",
];

export const ProfileImage = ({
  uri,
  name,
  size = 40,
  className,
}: ProfileImageProps) => {
  const initial = name?.charAt(0) || "?";
  const colorIndex = name ? name.charCodeAt(0) % BG_COLORS.length : 0;
  const bgColor = BG_COLORS[colorIndex];

  // 이미지 로딩 상태: uri가 있으면 처음엔 로딩 중으로 시작한다
  const [isLoading, setIsLoading] = useState(!!uri);
  // 이미지 로드 실패 시 이니셜 폴백으로 전환한다
  const [hasError, setHasError] = useState(false);

  if (uri && !hasError) {
    return (
      <div
        className={[styles.wrapper, className].filter(Boolean).join(" ")}
        style={{ width: size, height: size }}
      >
        {/* 이미지가 로드되기 전까지 shimmer 스켈레톤을 오버레이한다 */}
        {isLoading && <div className={styles.skeleton} />}
        <img
          src={uri}
          alt={name}
          className={[styles.image, isLoading && styles.imageHidden]
            .filter(Boolean)
            .join(" ")}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      </div>
    );
  }

  // uri가 없거나 로드 실패 시 이니셜 폴백
  return (
    <div
      className={[styles.fallback, className].filter(Boolean).join(" ")}
      style={{ width: size, height: size, backgroundColor: bgColor }}
    >
      <span className={styles.initial} style={{ fontSize: size * 0.4 }}>
        {initial}
      </span>
    </div>
  );
};

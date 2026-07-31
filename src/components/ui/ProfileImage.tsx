"use client";
import { memo, useState } from "react";
import Image from "next/image";

import { getInitials } from "@/utils/format";
import { cx } from "@/utils/cn";
import { useResetOnChange } from "@/hooks/useResetOnChange";

import styles from "./ProfileImage.module.scss";

interface ProfileImageProps {
  uri?: string;
  name: string;
  size?: number;
  className?: string;
}

// 이름 첫 글자의 char code로 색상을 결정해 동일 사용자는 항상 같은 색을 갖는다
const BG_COLORS = ["#3182F6", "#10b981", "#a855f7", "#f97316", "#ec4899", "#6366f1"];

/** 사용자 프로필 이미지(로딩 스켈레톤·에러 시 이니셜 폴백 포함) */
// 멤버 아바타 스택·채팅 버블 등 목록에서 반복 렌더링되므로, 부모(워크스페이스 쿼리 등) 리렌더 시에도
// uri·name·size·className이 그대로면 재계산을 건너뛴다
const ProfileImageComponent = ({ uri, name, size = 40, className }: ProfileImageProps) => {
  // 이미지 로딩 상태: uri가 있으면 처음엔 로딩 중으로 시작한다
  const [isLoading, setIsLoading] = useState(!!uri);
  // 이미지 로드 실패 시 이니셜 폴백으로 전환한다
  const [isError, setIsError] = useState(false);
  const uriChanged = useResetOnChange(uri);

  // uri가 바뀌면(프로필 사진 교체 등) 이전 로드 실패 상태가 남아 새 이미지도 계속 이니셜로 보이는 것을 방지
  if (uriChanged) {
    setIsLoading(!!uri);
    setIsError(false);
  }

  const trimmedName = name.trim();
  const initial = getInitials(name);
  const colorIndex = trimmedName ? trimmedName.charCodeAt(0) % BG_COLORS.length : 0;
  const bgColor = BG_COLORS[colorIndex];

  if (uri && !isError) {
    return (
      <div className={cx(styles.wrapper, className)} style={{ width: size, height: size }}>
        {/* 이미지가 로드되기 전까지 shimmer 스켈레톤을 오버레이한다 */}
        {isLoading && <div className={styles.skeleton} />}
        <Image
          src={uri}
          alt={name}
          width={size}
          height={size}
          className={cx(styles.image, isLoading && styles.imageHidden)}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setIsError(true);
          }}
        />
      </div>
    );
  }

  // uri가 없거나 로드 실패 시 이니셜 폴백
  return (
    <div
      className={cx(styles.fallback, className)}
      style={{ width: size, height: size, backgroundColor: bgColor }}
    >
      <span className={styles.initial} style={{ fontSize: size * 0.4 }}>
        {initial}
      </span>
    </div>
  );
};

export const ProfileImage = memo(ProfileImageComponent);
ProfileImage.displayName = "ProfileImage";

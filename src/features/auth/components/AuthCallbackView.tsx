"use client";

import { useSearchParams } from "next/navigation";

import { Spinner } from "@/components/feedback/Spinner";
import { useAuthCallback } from "@/features/auth/hooks/useAuthCallback";

import styles from "./AuthCallbackView.module.scss";

export const AuthCallbackView = () => {
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect"); // 로그인 전 원래 가려던 경로 (초대 참여 등)

  useAuthCallback(redirectPath);

  return (
    <div className={styles.container}>
      <Spinner />
      <p className={styles.message}>로그인 중입니다...</p>
    </div>
  );
};

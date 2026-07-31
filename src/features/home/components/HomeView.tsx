"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { MemoryFeed } from "@/features/home/components/MemoryFeed";
import { ROUTES } from "@/constants/routes";
import styles from "./HomeView.module.scss";

export const HomeView = () => {
  const router = useRouter();
  const { currentWorkspace, isPending, isError } = useCurrentWorkspace();

  // 목록 로딩이 끝난 뒤 조회에 성공했는데도 워크스페이스가 없을 때만 랜딩으로 이동
  // (로딩 중 오탐 리다이렉트 방지, 조회 실패를 "워크스페이스 없음"으로 오인해 리다이렉트하지 않도록 isError 제외)
  useEffect(() => {
    if (!isPending && !isError && !currentWorkspace) {
      router.replace(ROUTES.WORKSPACE.LANDING.path);
    }
  }, [isPending, isError, currentWorkspace, router]);

  if (isPending) return null;
  if (isError) return <p className={styles.errorText}>라이프룸 정보를 불러오지 못했습니다.</p>;
  if (!currentWorkspace) return null;

  return (
    <div className={styles.page}>
      <MemoryFeed />
    </div>
  );
};

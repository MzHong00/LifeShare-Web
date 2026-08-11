"use client";
import { BottomNav } from "@/components/layout/BottomNav";
import { useWorkspaceThemeSync } from "@/features/workspace/hooks/useWorkspaceThemeSync";

import styles from "./layout.module.scss";

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * 메인 영역 공통 레이아웃. 하단 네비게이션과 워크스페이스 테마 동기화를 적용한다.
 */
const MainLayout = ({ children }: MainLayoutProps) => {
  useWorkspaceThemeSync();

  return (
    <div className={styles.layout}>
      <main className={styles.main}>{children}</main>
      <BottomNav />
    </div>
  );
};

export default MainLayout;

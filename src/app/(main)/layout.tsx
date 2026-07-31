"use client";
import { BottomNav } from "@/components/layout/BottomNav";
import { useWorkspaceThemeSync } from "@/features/workspace/hooks/useWorkspaceThemeSync";
import styles from "./layout.module.scss";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  useWorkspaceThemeSync();

  return (
    <div className={styles.layout}>
      <main className={styles.main}>{children}</main>
      <BottomNav />
    </div>
  );
};

export default MainLayout;

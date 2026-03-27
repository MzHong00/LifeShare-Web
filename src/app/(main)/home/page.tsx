"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { DDayHero } from "@/components/home/DDayHero";
import { RecentChat } from "@/components/home/RecentChat";
import { RecentCalendar } from "@/components/home/RecentCalendar";
import { RecentStories } from "@/components/home/RecentStories";
import styles from "./home.module.scss";

export default function HomePage() {
  const router = useRouter();
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  useEffect(() => {
    if (!currentWorkspace) {
      router.replace("/workspace/landing");
    }
  }, [currentWorkspace, router]);

  if (!currentWorkspace) return null;

  return (
    <div className={styles.page}>
      <DDayHero />
      <RecentChat />
      <RecentCalendar />
      <RecentStories />
    </div>
  );
}

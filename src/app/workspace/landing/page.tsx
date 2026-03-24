"use client";
import { useRouter } from "next/navigation";
import { Heart, User } from "lucide-react";
import { APP_WORKSPACE } from "@/constants/config";
import styles from "./landing.module.scss";

export default function WorkspaceLandingPage() {
  const router = useRouter();

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <button onClick={() => router.push("/profile")} className={styles.profileButton}>
          <div className={styles.profileInner}>
            <User size={22} />
          </div>
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.logoWrap}>
          <Heart size={40} fill="#3182F6" color="#3182F6" />
        </div>

        <div className={styles.textCenter}>
          <h2 className={styles.heading}>
            함께하는 {APP_WORKSPACE.KR}이{"\n"}비어있어요
          </h2>
          <p className={styles.desc}>
            우리만의 소중한 기록을 담을{"\n"}첫 번째 {APP_WORKSPACE.KR}을 만들어볼까요?
          </p>
        </div>

        <button onClick={() => router.push("/workspace/setup")} className={styles.ctaButton}>
          새로운 {APP_WORKSPACE.KR} 만들기
        </button>
      </div>
    </main>
  );
}

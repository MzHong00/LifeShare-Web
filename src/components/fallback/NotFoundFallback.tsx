import { FileQuestion } from "lucide-react";
import Link from "next/link";

import { ICON_SIZE } from "@/constants/iconSize";
import { ROUTES } from "@/constants/routes";

import styles from "./NotFoundFallback.module.scss";

/** 존재하지 않는 경로 접근 시 노출되는 404 폴백 UI (not-found.tsx에서 공통으로 쓴다) */
export const NotFoundFallback = () => {
  return (
    <main className={styles.main}>
      <div className={styles.iconBadge}>
        <FileQuestion size={ICON_SIZE["4xl"]} />
      </div>

      <h1 className={styles.title}>페이지를 찾을 수 없어요</h1>
      <p className={styles.desc}>주소가 바뀌었거나 존재하지 않는 페이지예요.</p>

      <Link href={ROUTES.HOME.path} className={styles.homeButton}>
        홈으로 돌아가기
      </Link>
    </main>
  );
};

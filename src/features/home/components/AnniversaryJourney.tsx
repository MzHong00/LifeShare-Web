"use client";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAnniversaries } from "@/features/anniversary/hooks/useAnniversaries";
import { ICON_SIZE } from "@/constants/iconSize";
import { ROUTES } from "@/constants/routes";
import { cx } from "@/utils/cn";

import styles from "./AnniversaryJourney.module.scss";

import type { CSSProperties } from "react";

const JOURNEY_STOP_COUNT = 3; // 레일에 표시할 다가오는 기념일 정거장 수

/** 이전 기념일(또는 시작일)에서 다가오는 기념일 정거장들로 이어지는 여정 레일 — 하트가 실제 경과일 비율 위치에 떠 있다 */
export const AnniversaryJourney = () => {
  const router = useRouter();
  const { days, anniversaries, previousAnniversary } = useAnniversaries();

  const stops = anniversaries.slice(0, JOURNEY_STOP_COUNT); // 레일에 올릴 임박순 기념일 정거장들
  if (!stops.length) return null;

  // 이전 기념일 이후 경과일 — 지난 기념일이 없으면 시작일 기준 함께한 일수 사용
  const elapsedDays = previousAnniversary ? -previousAnniversary.daysLeft : days;
  // 이전 기념일 → 다음 기념일 구간에서 오늘 위치(0~1)
  const segmentProgress = Math.min(1, elapsedDays / (elapsedDays + stops[0].daysLeft));
  // 하트·프로그레스는 전체 레일의 첫 구간(정거장 수 분의 1) 안에서만 움직인다
  const heartRatio = segmentProgress / stops.length;

  return (
    <button
      type="button"
      onClick={() => router.push(ROUTES.ANNIVERSARY.path)}
      className={styles.journey}
      // 하트·프로그레스 위치는 런타임 값이라 CSS 변수로만 주입한다 (스타일 선언은 SCSS 모듈에 위치)
      style={{ "--heart-ratio": heartRatio } as CSSProperties}
      aria-label={`다음 기념일 ${stops[0].title}까지 ${stops[0].daysLeft}일 남음, 기념일 페이지로 이동`}
    >
      <div className={styles.railLine} />
      {/* 진행 게이지 — 하트 마커를 게이지 끝에 앵커링해 둘이 항상 같이 움직인다 */}
      <div className={styles.railFill}>
        <span className={styles.todayDot}>
          <Heart size={ICON_SIZE.sm} className={styles.todayHeart} />
        </span>
      </div>

      <div className={styles.nodes}>
        {/* 여정의 출발점: 가장 최근에 지난 기념일 (없으면 시작일) */}
        <div
          className={cx(styles.node, styles.passedNode)}
          // 노드(도트+라벨) 전체를 레일 좌표(0~1 비율)에 절대 배치 — 도트와 텍스트가 항상 함께 정렬된다
          style={{ "--node-ratio": 0 } as CSSProperties}
        >
          <span className={styles.dot} />
          <span className={styles.nodeLabel}>{previousAnniversary?.title ?? "시작"}</span>
          <span className={styles.nodeSub}>
            {previousAnniversary ? `${elapsedDays}일 전` : "0일"}
          </span>
        </div>

        {/* 다가오는 기념일 정거장들 (첫 정거장이 다음 목적지) */}
        {stops.map((stop, index) => (
          <div
            key={stop.id}
            // D-Day 당일에는 프로그레스가 도트까지 닿으므로 채워진 도트(passedNode)로 표시
            className={cx(
              styles.node,
              index === 0 && styles.nextNode,
              index === 0 && stop.daysLeft === 0 && styles.passedNode
            )}
            style={{ "--node-ratio": (index + 1) / stops.length } as CSSProperties}
          >
            <span className={styles.dot} />
            <span className={styles.nodeLabel}>{stop.title}</span>
            <span className={styles.nodeSub}>
              {stop.daysLeft === 0 ? "D-Day" : `D-${stop.daysLeft}`}
            </span>
          </div>
        ))}
      </div>
    </button>
  );
};

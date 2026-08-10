// Sentry 클라이언트(브라우저) 초기화 — Turbopack 환경에서는 이 파일(instrumentation-client.ts)만 인식되고
// 구 방식인 sentry.client.config.ts는 동작하지 않는다
// SDK를 정적 import하면 번들이 초기 로딩 청크(rootMainFiles)에 포함돼 첫 화면 렌더를 지연시키므로,
// 동적 import + 유휴 시점 초기화로 크리티컬 패스에서 분리한다
import { ENV } from "@/constants/config";

import type * as SentryModule from "@sentry/nextjs";

const TRACES_SAMPLE_RATE = 0.1; // 성능 트레이스 샘플링 비율(10%) — 무료 티어 쿼터 보호
const REPLAY_SESSION_SAMPLE_RATE = 0.1; // 일반 세션 중 리플레이를 남길 비율(10%) — 무료 티어 쿼터 보호
const REPLAY_ERROR_SAMPLE_RATE = 1.0; // 에러가 발생한 세션은 항상 리플레이 남김(원인 파악에 직접 필요)
const IDLE_FALLBACK_DELAY_MS = 2000; // requestIdleCallback 미지원 브라우저에서 초기화를 미루는 시간

let sentry: typeof SentryModule | null = null; // 초기화 완료된 SDK 모듈 (완료 전에는 null)

/** SDK를 동적으로 불러와 초기화한다 (첫 화면 렌더 이후 유휴 시점에 실행) */
const initSentry = async () => {
  const Sentry = await import("@sentry/nextjs");

  Sentry.init({
    dsn: ENV.SENTRY_DSN,
    tracesSampleRate: TRACES_SAMPLE_RATE,
    integrations: [
      // 개발 단계라 마스킹/미디어 블로킹 전체 해제 — 실서비스 전환 시 반드시 되돌릴 것
      // (커플 간 사적인 채팅·사진을 다루는 앱이라 운영 단계에선 제3자로 그대로 노출되면 안 됨)
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    replaysSessionSampleRate: REPLAY_SESSION_SAMPLE_RATE,
    replaysOnErrorSampleRate: REPLAY_ERROR_SAMPLE_RATE,
  });

  sentry = Sentry;
};

// DSN 미설정(로컬 개발 등) 시 초기화 자체를 건너뛴다 — 빈 DSN으로 init하면 콘솔에 경고가 반복 출력됨
if (ENV.SENTRY_DSN) {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => initSentry());
  } else {
    window.setTimeout(() => initSentry(), IDLE_FALLBACK_DELAY_MS);
  }
}

// 페이지 전환(라우팅) 성능 트레이스를 위해 Next.js가 요구하는 내비게이션 훅
// 초기화 완료 전(최초 진입 직후)의 전환은 트레이스가 남지 않는다 — 초기 로딩 속도를 위한 의도된 트레이드오프
export const onRouterTransitionStart: typeof SentryModule.captureRouterTransitionStart = (
  ...args
) => sentry?.captureRouterTransitionStart(...args);

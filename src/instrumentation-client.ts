// Sentry 클라이언트(브라우저) 초기화 — Turbopack 환경에서는 이 파일(instrumentation-client.ts)만 인식되고
// 구 방식인 sentry.client.config.ts는 동작하지 않는다
import * as Sentry from "@sentry/nextjs";

import { ENV } from "@/constants/config";

const TRACES_SAMPLE_RATE = 0.1; // 성능 트레이스 샘플링 비율(10%) — 무료 티어 쿼터 보호
const REPLAY_SESSION_SAMPLE_RATE = 0.1; // 일반 세션 중 리플레이를 남길 비율(10%) — 무료 티어 쿼터 보호
const REPLAY_ERROR_SAMPLE_RATE = 1.0; // 에러가 발생한 세션은 항상 리플레이 남김(원인 파악에 직접 필요)

// DSN 미설정(로컬 개발 등) 시 초기화 자체를 건너뛴다 — 빈 DSN으로 init하면 콘솔에 경고가 반복 출력됨
if (ENV.SENTRY_DSN) {
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
}

// 페이지 전환(라우팅) 성능 트레이스를 위해 Next.js가 요구하는 내비게이션 훅
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

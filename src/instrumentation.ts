// Next.js 서버 인스트루멘테이션 훅 — 서버/엣지 런타임에서 각각 한 번씩 호출된다
import { ENV } from "@/constants/config";

const TRACES_SAMPLE_RATE = 0.1; // 성능 트레이스 샘플링 비율(10%) — 무료 티어 쿼터 보호

/** 런타임(node/edge)에 맞는 Sentry 서버 SDK를 초기화한다 (DSN 미설정 시 건너뜀) */
export async function register() {
  if (!ENV.SENTRY_DSN) return;
  if (process.env.NEXT_RUNTIME !== "nodejs" && process.env.NEXT_RUNTIME !== "edge") return;

  const Sentry = await import("@sentry/nextjs");
  Sentry.init({ dsn: ENV.SENTRY_DSN, tracesSampleRate: TRACES_SAMPLE_RATE });
}

/** 서버 컴포넌트·라우트 핸들러에서 잡히지 않은 에러를 Sentry로 전달한다 */
export const onRequestError = async (
  error: unknown,
  request: Readonly<{ path: string; method: string; headers: Record<string, string | string[]> }>,
  context: Readonly<{ routerKind: string; routePath: string; routeType: string }>
) => {
  if (!ENV.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(error, request, context);
};

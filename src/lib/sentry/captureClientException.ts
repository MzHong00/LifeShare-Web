/**
 * 클라이언트에서 발생한 에러를 Sentry로 전송한다.
 * SDK를 정적 import하면 Error Boundary가 초기 로딩 청크에 포함되면서 SDK 번들까지 첫 화면 렌더를 지연시키므로,
 * 실제 에러가 발생한 시점에만 동적으로 불러온다.
 */
export const captureClientException = async (error: unknown) => {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureException(error);
};

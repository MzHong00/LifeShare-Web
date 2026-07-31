"use client";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

import { ErrorFallback } from "@/components/fallback/ErrorFallback";

// 루트 레이아웃(src/app/layout.tsx)이 렌더링되지 못한 상태라, 거기서 로드하던
// 디자인 토큰(CSS 변수) 전역 스타일을 여기서 직접 불러와야 ErrorFallback이 정상적으로 보인다
import "../styles/globals.scss";

interface GlobalErrorPageProps {
  error: Error & { digest?: string }; // Next.js가 전달하는 렌더링 에러
  reset: () => void; // 재렌더링해 복구를 시도하는 함수
}

/**
 * 루트 레이아웃(src/app/layout.tsx) 자체가 렌더링에 실패했을 때만 노출되는 최후의 Error Boundary.
 * 루트 레이아웃을 대체하므로 html·body 태그를 직접 선언해야 한다(Provider 등 레이아웃 컨텍스트 사용 불가).
 */
const GlobalError = ({ error, reset }: GlobalErrorPageProps) => {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <ErrorFallback onRetry={reset} />
      </body>
    </html>
  );
};

export default GlobalError;

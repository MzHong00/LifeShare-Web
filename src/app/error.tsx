"use client";
import { useEffect } from "react";
import { ErrorFallback } from "@/components/fallback/ErrorFallback";
import { captureClientException } from "@/lib/sentry/captureClientException";

interface ErrorPageProps {
  error: Error & { digest?: string }; // Next.js가 전달하는 렌더링 에러
  reset: () => void; // 세그먼트를 재렌더링해 복구를 시도하는 함수
}

/** 루트 세그먼트(로그인/워크스페이스 등) 렌더링 실패 시 노출되는 Error Boundary */
const RootError = ({ error, reset }: ErrorPageProps) => {
  // 클라이언트 렌더링 중 발생한 에러는 서버 인스트루멘테이션(onRequestError)이 못 잡으므로 여기서 직접 전송한다
  useEffect(() => {
    captureClientException(error);
  }, [error]);

  // error.message는 서버/DB 등 내부 에러 문구가 그대로 담길 수 있어 사용자에게 노출하지 않는다(ErrorFallback 기본 안내 문구 사용)
  return <ErrorFallback onRetry={reset} />;
};

export default RootError;

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const DEFAULT_STALE_TIME_MS = 60 * 1000; // 쿼리 기본 신선도 유지 시간 (1분)

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * TanStack Query 클라이언트를 생성하고 하위 트리에 제공한다.
 */
export const QueryProvider = ({ children }: QueryProviderProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: DEFAULT_STALE_TIME_MS,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

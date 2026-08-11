"use client";
import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase/client";
import { authQueries } from "@/features/auth/queries/authQueries";

interface SessionProviderProps {
  children: React.ReactNode;
}

/**
 * Supabase 인증 상태 변경을 구독해 유저 쿼리를 동기화한다.
 */
export const SessionProvider = ({ children }: SessionProviderProps) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Supabase가 세션(쿠키/로컬스토리지)을 자체 관리하므로 유저 쿼리만 동기화한다
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
        queryClient.invalidateQueries({ queryKey: authQueries.user().queryKey });
      }

      if (event === "SIGNED_OUT") {
        queryClient.removeQueries({ queryKey: authQueries.user().queryKey });
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return <>{children}</>;
};

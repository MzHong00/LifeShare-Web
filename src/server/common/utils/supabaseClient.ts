import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

import { ENV } from "@/constants/config";
import type { User } from "@/types/user";

/** 서버 컴포넌트/Route Handler용 Supabase 클라이언트 (요청 쿠키 기반, 매 요청 새로 생성) */
export const createServerSupabase = async (): Promise<SupabaseClient> => {
  const cookieStore = await cookies();

  return createServerClient(ENV.SUPABASE_URL, ENV.SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component에서는 쿠키 쓰기가 불가 — 세션 갱신은 middleware가 담당한다
        }
      },
    },
  });
};

/** 세션 쿠키에서 검증된 사용자를 얻는다 — 클라이언트가 보낸 신원(body/query)은 신뢰하지 않는다 */
export const getSessionUser = async (supabase: SupabaseClient): Promise<User | null> => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  return {
    id: user.id,
    name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
    email: user.email,
    profileImage: user.user_metadata?.avatar_url,
  };
};

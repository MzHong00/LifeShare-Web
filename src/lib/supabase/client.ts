import { createBrowserClient } from "@supabase/ssr";

import { ENV } from "@/constants/config";

import type { SupabaseClient } from "@supabase/supabase-js";

// 메서드 호출 시 this가 실제 클라이언트로 바인딩되도록 Proxy에서 bind 처리
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = createBrowserClient(ENV.SUPABASE_URL, ENV.SUPABASE_PUBLISHABLE_KEY);
    const value = client[prop as keyof SupabaseClient];
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});

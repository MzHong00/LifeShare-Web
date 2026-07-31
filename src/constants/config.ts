// NEXT_PUBLIC_* 값은 클라이언트 번들에 노출됨 (공개 가능 값만 사용)
export const ENV = {
  GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "", // 클라이언트 노출
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "", // 서버 전용 (노출 금지)
  GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "", // 클라이언트 노출
  GOOGLE_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? "", // 클라이언트 노출
  SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN ?? "", // 클라이언트 노출
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", // 클라이언트 노출
  SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "", // 클라이언트 노출
  // 체험용 공용 테스트 계정 — 누구나 로그인하도록 공개하는 값이라 클라이언트 노출이 의도된 설계
  TEST_ACCOUNT_EMAIL: process.env.NEXT_PUBLIC_TEST_ACCOUNT_EMAIL ?? "", // 클라이언트 노출
  TEST_ACCOUNT_PASSWORD: process.env.NEXT_PUBLIC_TEST_ACCOUNT_PASSWORD ?? "", // 클라이언트 노출
};

export const COOKIE_KEYS = {
  WORKSPACE_ID: "duous-workspace-id", // 서버(SSR prefetch)가 현재 워크스페이스를 식별하기 위한 쿠키
};

export const APP_BRAND_NAME = {
  KR: "듀어스",
  EN: "Duous",
};

export const APP_WORKSPACE = {
  KR: "라이프룸",
  EN: "LifeRoom",
};

export const SITE_URL = "https://duous.vercel.app"; // 실제 배포 도메인 확정 시 교체

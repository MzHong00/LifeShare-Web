export const ENV = {
  API_URL: process.env.NEXT_PUBLIC_API_URL ?? "",
  GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "", // 서버 사이드에서만 유효
  GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  GOOGLE_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? "",
  SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN ?? "",
};

export const APP_BRAND_NAME = {
  KR: "라이프쉐어",
  EN: "LifeShare",
};

export const APP_WORKSPACE = {
  KR: "라이프룸",
  EN: "LifeRoom",
};

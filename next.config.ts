import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  sassOptions: {
    loadPaths: [path.join(__dirname, "src")],
  },
  devIndicators: false,
  allowedDevOrigins: ["192.168.1.116"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
    unoptimized: true,
  },
};

// withSentryConfig: next.config의 webpack/turbopack 빌드 설정에 Sentry 플러그인을 끼워넣는 래퍼.
// 빌드된 번들과 원본 소스를 매칭하는 소스맵(에러 코드 위치 보여주기)을 생성해 Sentry 서버로 업로드하고,
// 클라이언트 코드에 릴리스 정보(release)를 자동으로 심어 이슈를 배포 버전별로 구분할 수 있게 해준다.
// 소스맵 업로드는 SENTRY_AUTH_TOKEN이 있을 때만 시도 (없으면 조용히 건너뜀 — 로컬/CI에서 빌드가 막히지 않도록)
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true, // 빌드 로그에 Sentry 배너 출력 안 함
  widenClientFileUpload: true,
  telemetry: false, // Sentry 자체 사용 통계 수집 비활성화
});

import path from "path";

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// .mts 확장자로 두어 Vite가 이 파일을 ESM으로 로드하게 한다
// (.ts로 두면 CommonJS로 읽혀 "ESM syntax in a file loaded as CommonJS" 경고가 난다).
// ESM에는 __dirname이 없으므로 import.meta.dirname을 쓴다 (Node 20.11+).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
        // Next.js 페이지·레이아웃은 얇은 조합 계층이라 제외한다.
        // 반면 app/api의 Route Handler는 인증·인가 분기를 담고 있어 측정 대상에 포함한다.
        "src/app/**/page.tsx",
        "src/app/**/layout.tsx",
        "src/app/**/{error,global-error,not-found}.tsx",
        "src/**/types/**", // 타입 전용 파일
        "src/**/constants/**", // 상수 선언 전용 파일
      ],
      // 커버리지가 이 아래로 떨어지면 테스트 명령이 실패한다 (CI가 회귀를 막는 안전장치).
      // 목표치가 아니라 "이미 달성한 수준을 잃지 않기 위한 하한선"이라 현재 수치보다 낮게 잡는다.
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 75,
        // 인증·인가 분기가 모여 있어 회귀 시 곧바로 보안 문제가 되는 계층
        "src/app/api/**": { statements: 95, branches: 95, functions: 90 },
        // 순수 함수 모음이라 테스트 비용이 낮고 파급은 큰 계층
        "src/utils/**": { statements: 95, branches: 95, functions: 95 },
        // 상태·비즈니스 로직이 모인 계층
        "src/features/**/hooks/**": { statements: 95, branches: 90, functions: 90 },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      // "server-only" import 문은 실제 앱에서는 Next.js가 처리해주지만, 테스트 실행기(Vite)는
      // 이 패키지 자체가 디스크에 없어서 파일을 열어보기도 전에 에러를 낸다. 그래서 테스트를 돌릴
      // 때만 이 이름을 진짜 패키지 대신 옆에 있는 빈 파일(vitest.serverOnly.stub.ts)로 돌린다.
      // vi.mock으로는 안 된다 — 문제가 "내용이 잘못됨"이 아니라 "파일 자체를 못 찾음"이라
      // 실행 전 경로 해석 단계에서 막히기 때문이다. 실제 앱 빌드에는 영향 없다.
      "server-only": path.resolve(import.meta.dirname, "./vitest.serverOnly.stub.ts"),
    },
  },
});

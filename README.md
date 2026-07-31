# LifeShare Web

> 파트너와 일상·일정·추억을 함께 나누는 프리미엄 커플 웹앱

<br />

## 스크린샷

| 홈 | 위치 | 채팅 | 스토리 |
|:---:|:---:|:---:|:---:|
| ![home](https://via.placeholder.com/120x240/3182F6/ffffff?text=Home) | ![map](https://via.placeholder.com/120x240/3182F6/ffffff?text=Map) | ![chat](https://via.placeholder.com/120x240/3182F6/ffffff?text=Chat) | ![stories](https://via.placeholder.com/120x240/3182F6/ffffff?text=Stories) |

<br />

## 주요 기능

- **홈** — D-Day 카운터, 최근 캘린더·스토리 요약
- **캘린더** — 커플 일정 공유 및 관리
- **기념일** — 100일·주년 등 자동 기념일 계산
- **스토리** — 위치 경로 기반 추억 기록
- **위치** — 실시간 파트너 위치 공유 및 지도
- **채팅** — 1:1 실시간 채팅
- **프로필** — 구글 소셜 로그인, 워크스페이스 관리

<br />

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript 5 |
| 스타일 | SCSS Modules + CSS Variables |
| 상태관리 | Zustand 5 |
| 서버 상태 | TanStack React Query 5 |
| HTTP | fetch 기반 커스텀 API 클라이언트 |
| 아이콘 | Lucide React |
| 지도 | Google Maps API |
| 인증 | Supabase Auth(SSR, 쿠키 세션) + Google OAuth 2.0 |
| 배포 | Vercel (GitHub Actions CI/CD) |

<br />

## 시작하기

### 요구사항

- Node.js 20+
- npm

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/{username}/lifeshare-web.git
cd lifeshare-web

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일을 열어 값 입력

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 환경변수

```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_API_KEY=
```

<br />

## 프로젝트 구조

Bulletproof React 스타일(공용 자원 최상위 평탄화) + `features/` 도메인 슬라이스로 구성됩니다.

```
src/
├── app/                  # Next.js App Router (라우트만, SSR prefetch 담당)
│   ├── (auth)/login/     # 로그인
│   ├── (main)/           # 메인 (BottomNav 공유)
│   │   ├── home/         # SSR: 유저·스토리·캘린더·할일 prefetch
│   │   ├── calendar/     # SSR: 캘린더·할일 prefetch
│   │   ├── anniversary/
│   │   ├── stories/      # SSR: 스토리 목록·상세 prefetch
│   │   ├── map/          # CSR (Google Maps)
│   │   ├── todo/         # SSR: 할일 prefetch
│   │   └── profile/
│   ├── api/              # BFF Route Handlers (컨트롤러 역할, DB 직접 접근 금지 시 유일한 진입점)
│   ├── auth/callback/    # OAuth 콜백
│   ├── chat/             # 채팅 (CSR)
│   └── workspace/        # 워크스페이스 (landing·setup·list·join·edit)
├── features/             # 도메인별 슬라이스
│   └── [feature]/        # api(BFF fetch) · components · hooks · queries · stores · types
├── server/               # 서버 전용 코드 (`server-only`로 클라이언트 번들 유입 차단)
│   ├── db/               # Supabase 서버 클라이언트 생성
│   ├── auth/             # 세션 조회(session.ts) · 미들웨어 세션 갱신(middleware.ts)
│   └── http/              # API Route 공통 응답 헬퍼·타입
├── components/           # 재사용 컴포넌트
├── constants/            # 상수 및 설정
├── hooks/                # 커스텀 훅
├── lib/                  # 외부 연동 및 클라이언트 유틸
│   ├── supabase/         # 브라우저 Supabase 클라이언트, 스토리지 업로드
│   └── api/              # BFF 호출 fetch 클라이언트(bffClient), 목 fetch
├── stores/               # 전역 Zustand 스토어
├── styles/               # 전역 스타일, 믹스인
├── types/                # 공유 타입
├── utils/                # 유틸리티 함수
└── assets/               # 아이콘 등 에셋
proxy.ts                  # 쿠키 세션 갱신 + 비로그인 라우트 보호 (middleware)
```

### 데이터 패칭 전략

- `features/[feature]/queries`에 정의된 `queryOptions`는 서버(prefetch)·클라이언트(useQuery) 양쪽에서 공유됩니다.
- 서버 컴포넌트가 워크스페이스 쿠키 기준으로 `prefetchQuery` 후 `HydrationBoundary`로 감싸면, 클라이언트의 `useQuery`가 이어받아 첫 페인트부터 데이터가 채워집니다.
- 지도(`map`)·채팅(`chat`)처럼 실시간·상호작용 중심 화면은 SSR 대상에서 제외하고 CSR로 유지합니다.
- 클라이언트는 Supabase를 직접 호출하지 않고 `app/api`(BFF)를 경유합니다. 예외는 파일 업로드(`lib/supabase/storage.ts`)로, 바이너리 이중 전송을 피하기 위해 RLS로 보호된 Supabase Storage에 직접 업로드합니다.

<br />

## CI/CD

`main` 브랜치에 push되면 GitHub Actions가 자동으로 실행됩니다.

```
push to main
  └── CI (Type Check → Lint → Build)
        └── CD (Vercel 프로덕션 배포)
```

<br />

## 커밋 컨벤션

| 태그 | 설명 |
|------|------|
| `feat` | 새로운 기능 |
| `fix` | 버그 수정 |
| `refactor` | 리팩토링 |
| `style` | UI·스타일 변경 |
| `chore` | 설정, 패키지 관리 |
| `docs` | 문서 수정 |
| `base` | 초기 설정 |

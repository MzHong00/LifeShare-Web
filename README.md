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
| HTTP | Axios |
| 아이콘 | Lucide React |
| 지도 | Google Maps API |
| 인증 | Google OAuth 2.0 |
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

```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           # 로그인
│   ├── (main)/           # 메인 (BottomNav 공유)
│   │   ├── home/
│   │   ├── calendar/
│   │   ├── anniversary/
│   │   ├── stories/
│   │   ├── chat/
│   │   ├── map/
│   │   └── profile/
│   └── workspace/        # 워크스페이스 관리
├── components/           # 재사용 컴포넌트
├── stores/               # Zustand 스토어
├── hooks/                # 커스텀 훅
├── api/                  # API 호출 함수
├── types/                # 공유 타입 정의
├── utils/                # 유틸리티 함수
├── constants/            # 상수 및 설정
├── assets/               # 아이콘 등 에셋
└── styles/               # 전역 스타일, 믹스인
```

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

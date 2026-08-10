# 듀어스 (Duous)

> 연인·가족이 일정, 추억, 위치, 대화를 한 공간에서 나누는 모바일 웹앱

[**데모 바로가기**](https://duous.vercel.app) · 로그인 화면의 **가입 없이 체험해보기** 버튼으로 바로 둘러볼 수 있습니다.

<br />

## 이런 걸 만들었습니다

연인·가족끼리 쓰는 기록은 카카오톡·캘린더·사진첩·지도에 흩어집니다. 나중에 "그때 어디 갔었지"를 찾으려면 앱 네 개를 뒤져야 하죠.

듀어스는 이걸 **라이프룸**이라는 하나의 공간으로 묶습니다. 같은 라이프룸에 속한 사람은 일정·할 일·스토리·대화·위치를 공유하고, 한 명이 남긴 기록이 상대에게 바로 보입니다.

<br />

## 주요 기능

| 기능 | 설명 |
|------|------|
| **홈** | D-Day 카운터, 최근 일정·스토리 요약 |
| **캘린더** | 일정 공유 및 관리 |
| **기념일** | 100일·주년 자동 계산 |
| **스토리** | 이동 경로가 지도에 그려지는 추억 기록 |
| **위치** | 실시간 위치 공유 |
| **채팅** | 실시간 메시지 |
| **라이프룸** | 초대 코드로 참여, 방장의 멤버·권한 관리 |

<br />

## 기술 스택

| 분류 | 기술 | 선택 이유 |
|------|------|-----------|
| 프레임워크 | Next.js 16 (App Router) | 서버에서 미리 받아온 데이터로 첫 화면을 채워 모바일 체감 속도 확보 |
| 언어 | TypeScript 5 | — |
| 스타일 | SCSS Modules + CSS Variables | 라이프룸별 테마 색상을 CSS 변수로 런타임 교체 |
| 서버 상태 | TanStack Query 5 | 쿼리 정의를 도메인별 팩토리로 모아 캐시 무효화 범위를 계층으로 관리 |
| 클라이언트 상태 | Zustand 5 | 전역 상태가 적어 store 단위로 얇게 유지 |
| 백엔드 | Supabase (Postgres · Auth · Storage) | 별도 서버 없이 RLS로 데이터 격리 |
| 인증 | Supabase Auth(쿠키 세션) + Google OAuth | — |
| 모니터링 | Sentry | 에러·세션 리플레이 |
| 테스트 | Vitest + Testing Library | 1,051개 · 커버리지 86% |
| 배포 | Vercel + GitHub Actions | — |

<br />

## 빠른 시작

```bash
git clone https://github.com/MzHong00/duous.git
cd duous

npm ci

cp .env.example .env.local
# .env.local을 열어 Supabase·Google 값을 채웁니다 (파일 안에 발급처가 적혀 있습니다)

npm run dev
```

[http://localhost:3000](http://localhost:3000) 접속

**요구사항** — Node.js 22+, npm

> DB 스키마와 RLS 정책은 Supabase 대시보드에서 직접 관리합니다. 저장소에는 SQL이 없으므로, 새 Supabase 프로젝트에 연결하려면 기존 프로젝트의 스키마·정책·함수를 그대로 옮겨야 합니다.

### 자주 쓰는 명령

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run check` | 포맷 → 빌드 → 린트 → 테스트 일괄 검증 (푸시 전 권장) |
| `npm test` | 테스트 |
| `npm run test:coverage` | 커버리지 리포트 |
| `npm run seed:test-account` | 체험 계정 데이터 초기화 |

<br />

## 아키텍처

### 레이어

```
브라우저 ──▶ app/api (BFF) ──▶ server/domain (repository) ──▶ Supabase
   │                                                              ▲
   └──────────── 파일 업로드만 직접 (RLS로 보호) ───────────────────┘
```

- **클라이언트는 Supabase를 직접 호출하지 않습니다.** 모든 접근은 `app/api`의 Route Handler를 거칩니다. 예외는 파일 업로드 하나로, 바이너리를 서버에 한 번 더 태우지 않기 위해 Storage로 직접 보냅니다.
- **`features/[도메인]/`** 슬라이스로 나뉩니다 — `api`(BFF 호출) · `components` · `hooks` · `queries` · `stores` · `types`. 도메인은 `workspace`, `calendar`, `stories`, `todo`, `chat`, `map`, `anniversary`, `auth`, `profile`, `home`.
- **`server/`** 는 `server-only`로 잠가 클라이언트 번들 유입을 차단합니다. `domain/[도메인]/repository.ts`가 Supabase 쿼리를 전담하고, Route Handler는 인증·검증·조합만 합니다.

### 데이터 패칭

서버 상태는 TanStack Query로 관리합니다. 쿼리 정의는 도메인별 `features/[도메인]/queries`에 `queryOptions` 팩토리로 모아두고, 키를 문자열로 직접 쓰지 않아 무효화 범위를 계층으로 다룹니다.

클라이언트는 Supabase를 직접 호출하지 않고 `app/api`(BFF)를 경유합니다. 예외는 파일 업로드(`lib/supabase/storage.ts`)로, 바이너리를 서버에 한 번 더 태우지 않기 위해 Storage로 직접 보냅니다.

### 라이프룸 초대

참여 경로는 두 가지이고 같은 초대 코드를 씁니다.

| 경로 | 화면 |
|------|------|
| 코드 직접 입력 | `/workspace/join` |
| 링크 공유 | `/workspace/join/[code]` |

- **코드 형식** — Crockford Base32 8자리(`K7M2-P9QX`). 헷갈리는 `I·L·O·U`를 뺐고, 입력할 때 대소문자·하이픈·공백을 흡수하며 `I→1` `O→0`으로 교정합니다.
- **라이프룸당 코드 1개** — 재발급하면 이전 코드와 링크가 즉시 무효가 됩니다. 잘못 공유한 코드를 회수하는 유일한 수단입니다.
- **권한** — `owner`(방장) / `member`. 초대 발급과 멤버 내보내기는 방장만 할 수 있고, 방장이 다른 멤버를 남기고 나가면 남은 멤버에게 자동으로 위임됩니다.

### 접근 제어 (RLS)

서버 라우트도 익명 키 + 사용자 쿠키로 동작합니다. 즉 **모든 접근 제어가 Postgres RLS에 걸려 있습니다.** 정책과 함수는 Supabase 대시보드에서 관리합니다.

테이블 직접 접근은 전부 멤버십 기준입니다. 다만 초대받은 사람은 아직 멤버가 아니라 라이프룸을 읽을 수 없어서, **코드를 정확히 아는 경우에만** 열리는 `SECURITY DEFINER` 함수로 좁게 뚫었습니다.

| 함수 | 역할 |
|------|------|
| `get_invite_preview(code)` | 참여 전 미리보기(이름·유형·인원수). 멤버 목록과 기록은 노출하지 않음 |
| `join_workspace_with_code(code, ...)` | 코드 검증과 멤버 추가를 원자적으로 처리. 멤버 직접 INSERT는 생성 흐름으로만 제한돼 있어 초대 참여의 유일한 경로 |
| `transfer_workspace_ownership(id)` | 방장 나가기 시 자동 위임 |

<br />

## CI/CD

`main` 브랜치 push 시 GitHub Actions가 실행됩니다.

```
push to main
├── 🔎 Quality   포맷 검사 → 타입 체크 → 린트 → 테스트
│               커버리지가 기준 아래로 떨어지면 여기서 실패한다
└── 🛠️ Build     Next.js 빌드 (빌드 캐시 재사용)

Vercel이 저장소를 직접 구독해 프로덕션 배포
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

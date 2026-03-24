# LifeShare Web — Project Guide

이 파일은 LifeShare Web 프로젝트의 핵심 가이드라인과 개발 규칙을 담고 있습니다. 모든 개발 과정에서 이 문서를 최우선으로 참조합니다.

---

## 🚀 프로젝트 개요

- **이름**: LifeShare Web (`lifeshare-web`)
- **목표**: 파트너(연인, 가족 등)와 일상·일정·추억을 공유하는 프리미엄 커플 웹앱 (모바일 최적화)
- **핵심 디자인 키워드**: Toss-style, Minimalist, Premium, Blue (`#3182F6`)
- **max-width**: `480px` (body 기준, 모바일 앱처럼 가운데 정렬)

---

## 🛠 테크 스택

| 역할 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript 5 |
| 스타일 | SCSS Modules (`*.module.scss`) + CSS 변수 |
| 상태관리 | Zustand 5 (`persist` 미들웨어) |
| 서버 상태 | TanStack React Query 5 |
| HTTP 클라이언트 | Axios (`src/lib/axios.ts`) |
| 아이콘 | Lucide React |
| 날짜 처리 | dayjs |
| 지도 | @react-google-maps/api |
| OAuth | @react-oauth/google |

---

## 📂 디렉토리 구조

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/login/           # 인증 라우트 그룹
│   ├── (main)/                 # 메인 라우트 그룹 (BottomNav 공유)
│   │   ├── layout.tsx
│   │   ├── home/
│   │   ├── calendar/
│   │   ├── anniversary/
│   │   ├── stories/[id]/
│   │   ├── stories/edit/
│   │   ├── chat/
│   │   ├── map/
│   │   ├── profile/
│   │   ├── profile/settings/
│   │   ├── profile/privacy/
│   │   └── todo/create/
│   └── workspace/              # 워크스페이스 관리
│       ├── landing/
│       ├── setup/
│       ├── list/
│       └── edit/
├── components/                 # 재사용 컴포넌트 (도메인별 분리)
│   ├── common/                 # AppHeader, BottomNav, Modal, Toast, Card ...
│   ├── auth/
│   ├── chat/
│   ├── home/
│   ├── map/
│   ├── profile/
│   ├── stories/
│   └── todo/
├── api/                        # API 호출 함수
├── stores/                     # Zustand 스토어
├── hooks/                      # 커스텀 훅
├── lib/                        # 외부 라이브러리 설정 (axios.ts)
├── constants/                  # theme.ts, config.ts, mockData.ts
├── types/                      # index.ts (공유 타입 정의)
├── utils/                      # date.ts, format.ts, cn.ts
└── styles/                     # globals.scss, _mixins.scss
```

---

## 🎨 스타일링 규칙

### 1. SCSS Modules

- 모든 스타일은 `*.module.scss` 파일로 작성한다. 인라인 스타일 (`style={{}}`) 사용을 지양한다.
- 컴포넌트와 같은 위치에 모듈 파일을 둔다.

### 2. CSS 변수 (Design Tokens)

색상은 `globals.scss`에 정의된 CSS 커스텀 프로퍼티를 사용한다. 하드코딩된 Hex 코드는 절대 사용하지 않는다.

```scss
// 사용 예시
color: var(--primary);
background-color: var(--grey-100);
```

주요 토큰:

| 변수 | 값 |
|------|----|
| `--primary` | `#3182f6` |
| `--primary-light` | `#e8f3ff` |
| `--grey-50` ~ `--grey-900` | Grey scale |
| `--success` | `#00d494` |
| `--error` | `#f04452` |
| `--shadow-card` | `0 2px 8px rgba(0,0,0,0.06)` |

TypeScript에서 색상이 필요한 경우 (style prop 등)에는 `@/constants/theme`의 `COLORS` 객체를 사용한다.

### 3. SCSS Mixins

공통 패턴은 `src/styles/_mixins.scss`에 정의된 mixin을 사용한다. 모듈 파일 상단에 `@use` 선언이 필요하다.

```scss
// 경로는 파일 위치에 따라 조정
@use '../../styles/mixins' as *;

.container {
  @include flex-center;       // display:flex + align/justify center
  @include flex-between;      // display:flex + space-between
  @include flex-row(12px);    // display:flex + align-items:center + gap
  @include flex-col(8px);     // display:flex + flex-direction:column + gap
  @include flex-col-center;   // column + align-items:center
  @include icon-box(40px, 12px); // 고정 크기 + border-radius + flex-center
  @include scrollbar-hide;    // 스크롤바 숨기기
  @include text-ellipsis;     // 말줄임
  @include page-base;         // 스크롤 페이지 기본 (height:100%, overflow-y:auto, pb:80px)
  @include form-input;        // 인풋 공통 스타일
  @include btn-primary;       // 기본 저장 버튼 스타일
}
```

---

## 💻 코드 작성 규칙

### 1. 컴포넌트

- 모든 컴포넌트는 화살표 함수 (`const Foo = () => { ... }`) 형식으로 작성한다.
- 클라이언트 사이드 로직 (이벤트, 상태 등)이 있는 파일은 반드시 `"use client";`를 첫 줄에 선언한다.
- 컴포넌트 내부에 또 다른 컴포넌트를 정의(Nested Component)하지 않는다. 필요 시 파일 내 최상위 수준에서 정의하거나 별도 파일로 분리한다.

### 2. TypeScript

- `any` 타입 사용을 지양하고, 명확한 타입을 정의한다.
- 타입을 import할 때는 `import type` 키워드를 사용한다.
- 도메인 공유 타입은 반드시 `@/types`에서 관리하고 재사용한다.
- 타입 정의는 `interface` 또는 `type`으로 명확하게 기술한다.

### 3. Import 순서

```typescript
// 1. 외부 라이브러리
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. (개행)

// 3. 내부 파일 (@/ 절대 경로 사용)
import type { Story } from '@/types';
import { COLORS } from '@/constants/theme';
import apiClient from '@/lib/axios';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatDate } from '@/utils/date';
import { useModal } from '@/hooks/useModal';
import Button from '@/components/common/Button';

// 4. (개행)

// 5. SCSS 모듈
import styles from './Foo.module.scss';
```

`@/` 절대 경로를 항상 사용한다 (상대 경로 지양).

### 4. 날짜 처리

컴포넌트 내부에서 `new Date()` 또는 `dayjs()`를 직접 사용하지 않고, `@/utils/date`에 정의된 공통 유틸리티 함수를 사용한다.

### 5. Alert

브라우저 기본 `alert()`를 사용하지 않고, `useModalStore`를 사용한다.

---

## 🗃 상태 관리 (Zustand)

Zustand 스토어는 다음 패턴을 따른다.

```typescript
"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FooState {
  items: Item[];
  setItems: (items: Item[]) => void;
}

export const useFooStore = create<FooState>()(
  persist(
    (set) => ({
      items: [],
      setItems: (items) => set({ items }),
    }),
    { name: "foo-storage" }
  )
);

// 훅 외부에서도 호출 가능한 액션 객체
export const fooActions = {
  setItems: (items: Item[]) => useFooStore.getState().setItems(items),
};
```

- **상태(State)**와 **액션(Actions)**을 분리한다. 액션은 `xxxActions` 객체로 export하여 훅 규칙 없이 어디서든 호출 가능하게 한다.
- 영속성이 필요한 스토어는 `persist` 미들웨어를 사용한다.
- `"use client"` 선언 필수.

---

## 🌐 API 통신

- 모든 HTTP 요청은 `@/lib/axios.ts`의 `apiClient`를 사용한다.
- 요청 인터셉터가 `localStorage`의 `auth-storage`에서 accessToken을 자동으로 주입한다.
- 401 응답 시 `/login`으로 자동 리다이렉트된다.
- 환경 변수는 `@/constants/config.ts`의 `ENV` 객체를 통해 접근한다. 컴포넌트에서 `process.env`를 직접 참조하지 않는다.

---

## 📝 Git & Commit Convention

### 커밋 메시지 형식

`태그: 메시지`

### 태그

| 태그 | 설명 |
|------|------|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 코드 리팩토링 (기능 변화 없음) |
| `style` | UI·스타일 변경 |
| `chore` | 설정 변경, 패키지 관리, 주석 수정 |
| `docs` | 문서 수정 |
| `deploy` | 배포 관련 작업 |
| `base` | 초기 설정 또는 핵심 아키텍처 작업 |

### 작성 규칙

- 메시지는 **한글**로 작성한다.
- 무엇을 왜 변경했는지 명확하게 설명한다.
- 기능별 또는 논리적 단위로 분할하여 커밋한다.

---

## 🤖 AI 어시스턴트 지침

- 성능과 보안을 최우선으로 고려한다.
- UI 작업 시 Toss 스타일의 간결하고 직관적인 디자인을 추구한다.
- 주석·에러 메시지는 한국어로 작성한다.
- `import React from 'react'`는 꼭 필요한 경우에만 선언한다.
- 색상 하드코딩 금지 — CSS 변수(`var(--primary)`) 또는 `COLORS` 객체를 사용한다.
- SCSS 중복 패턴 발생 시 `_mixins.scss`의 mixin을 우선 활용한다.
- 새 페이지 스타일에는 `@include page-base`를 기본으로 적용한다.

---

_최종 업데이트: 2026-03-24_

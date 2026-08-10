import type { Metadata } from "next";

// 로그인 없이 접근 가능해 검색엔진에 노출해야 하는 페이지만 true
export const INDEXABLE_ROBOTS: Metadata["robots"] = { index: true, follow: true };
export const NOINDEX_ROBOTS: Metadata["robots"] = { index: false, follow: false };

export const PAGE_TITLES = {
  LOGIN: "로그인",
  WORKSPACE_LANDING: "듀어스 시작하기",
  WORKSPACE_JOIN: "워크스페이스 초대",
  WORKSPACE_CODE_JOIN: "초대 코드로 참여",
  WORKSPACE_SETUP: "워크스페이스 만들기",
  WORKSPACE_LIST: "워크스페이스 목록",
  WORKSPACE_EDIT: "워크스페이스 수정",
  HOME: "홈",
  CALENDAR: "캘린더",
  CHAT: "채팅",
  ANNIVERSARY: "기념일",
  MAP: "지도",
  PROFILE: "프로필",
  PROFILE_SETTINGS: "설정",
  PROFILE_PRIVACY: "개인정보 처리방침",
  TODO: "할 일",
  TODO_CREATE: "할 일 만들기",
  STORIES: "스토리",
  STORIES_LIST: "스토리 목록",
  STORIES_EDIT: "스토리 편집",
  STORY_DETAIL: "스토리 상세",
} as const;

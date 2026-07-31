"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { COOKIE_KEYS } from "@/constants/config";

interface WorkspaceState {
  currentWorkspaceId: string | null; // 현재 선택된 워크스페이스 ID (유일한 클라이언트 상태)
}

const workspaceStore = create<WorkspaceState>()(
  persist(
    (): WorkspaceState => ({
      currentWorkspaceId: null,
    }),
    {
      name: "workspace-storage",
      version: 2,
      migrate: () => ({ currentWorkspaceId: null }),
    }
  )
);

const WORKSPACE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 워크스페이스 쿠키 유지 기간 (1년)

// currentWorkspaceId 변경 시 쿠키 동기화 — 서버 컴포넌트의 SSR prefetch가 이 쿠키로 워크스페이스를 식별
workspaceStore.subscribe((state, prev) => {
  const id = state.currentWorkspaceId;
  if (id === prev.currentWorkspaceId) return;
  document.cookie = id
    ? `${COOKIE_KEYS.WORKSPACE_ID}=${id}; path=/; max-age=${WORKSPACE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`
    : `${COOKIE_KEYS.WORKSPACE_ID}=; path=/; max-age=0`;
});

export const useWorkspaceStore = <T>(selector: (state: WorkspaceState) => T) =>
  workspaceStore(selector);

export const workspaceActions = {
  setCurrentWorkspaceId: (id: string | null) => workspaceStore.setState({ currentWorkspaceId: id }),

  clearData: () => workspaceStore.setState({ currentWorkspaceId: null }),
};

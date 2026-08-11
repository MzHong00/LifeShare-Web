"use client";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

interface GlobalLoadingState {
  isLoading: boolean;
  message: string | null; // 오버레이에 표시할 안내 문구(없으면 스피너만 표시)
}

const globalLoadingStore = create<GlobalLoadingState>()(() => ({
  isLoading: false,
  message: null,
}));

/** 전역 로딩 상태 셀렉터 훅 (useShallow 내장) */
export const useGlobalLoadingStore = <T>(selector: (state: GlobalLoadingState) => T) =>
  globalLoadingStore(useShallow(selector));

export const globalLoadingActions = {
  /** 전역 로딩 오버레이를 표시한다 */
  show: (message?: string) =>
    globalLoadingStore.setState({ isLoading: true, message: message ?? null }),
  /** 전역 로딩 오버레이를 숨긴다 */
  hide: () => globalLoadingStore.setState({ isLoading: false, message: null }),
};

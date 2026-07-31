"use client";
import { create } from "zustand";
import type { ToastType } from "@/types/toast";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  toast: ToastItem | null;
}

const TOAST_DURATION_MS = 2000; // 토스트 자동 제거까지의 시간(ms)

const toastStore = create<ToastState>()(() => ({ toast: null }));

let hideTimer: ReturnType<typeof setTimeout> | null = null; // 자동 제거 타이머(새 토스트가 뜨면 이전 타이머를 취소하고 갱신)

/** 토스트 상태 셀렉터 훅 */
export const useToastStore = <T>(selector: (state: ToastState) => T) => toastStore(selector);

export const toastActions = {
  /** 토스트를 표시한다. 이전 토스트가 있다면 즉시 교체하고 TOAST_DURATION_MS 후 자동 제거한다 */
  showToast: (message: string, type: ToastType = "info") => {
    const id = `toast-${crypto.randomUUID()}`;
    if (hideTimer) clearTimeout(hideTimer);
    toastStore.setState({ toast: { id, message, type } });
    hideTimer = setTimeout(() => {
      toastStore.setState({ toast: null });
    }, TOAST_DURATION_MS);
  },
  /** id가 현재 토스트와 일치하면 즉시 제거한다 */
  removeToast: (id: string) => {
    if (hideTimer) clearTimeout(hideTimer);
    toastStore.setState((state) => (state.toast?.id === id ? { toast: null } : state));
  },
};

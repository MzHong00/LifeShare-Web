"use client";
import { create } from "zustand";
import type { ToastType } from "@/types";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: ToastItem[];
}

const toastStore = create<ToastState>()(() => ({ toasts: [] }));

export const useToastStore = <T = ToastState>(
  selector: (state: ToastState) => T = (state) => state as unknown as T
) => toastStore(selector);

export const toastActions = {
  showToast: (message: string, type: ToastType = "info") => {
    const id = `toast-${Date.now()}`;
    toastStore.setState((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      toastStore.setState((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);
  },
  removeToast: (id: string) => {
    toastStore.setState((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
};

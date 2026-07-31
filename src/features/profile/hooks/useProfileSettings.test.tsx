import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { authApi } from "@/features/auth/api/auth";
import { modalActions } from "@/stores/useModalStore";
import { toastActions } from "@/stores/useToastStore";
import { useProfileSettings } from "./useProfileSettings";

import type { ReactNode } from "react";

const routerReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace }),
}));

vi.mock("@/features/auth/api/auth", () => ({
  authApi: { signOut: vi.fn() },
}));

vi.mock("@/stores/useModalStore", () => ({
  modalActions: { showModal: vi.fn() },
}));

vi.mock("@/stores/useToastStore", () => ({
  toastActions: { showToast: vi.fn() },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

describe("useProfileSettings - confirmLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("로그아웃 실패 시 세션 정리·이동 없이 에러 토스트를 표시한다", async () => {
    vi.mocked(authApi.signOut).mockRejectedValueOnce(new Error("network error"));

    const { result } = renderHook(() => useProfileSettings(), { wrapper: createWrapper() });
    result.current.confirmLogout();

    const { onConfirm } = vi.mocked(modalActions.showModal).mock.calls[0][0];
    await onConfirm?.();

    await waitFor(() =>
      expect(toastActions.showToast).toHaveBeenCalledWith(
        "로그아웃에 실패했습니다. 다시 시도해주세요.",
        "error"
      )
    );
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("로그아웃 성공 시 로그인 페이지로 이동한다 (다음 로그인 시 이전 선택 라이프룸을 유지하기 위해 currentWorkspaceId는 지우지 않는다)", async () => {
    vi.mocked(authApi.signOut).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useProfileSettings(), { wrapper: createWrapper() });
    result.current.confirmLogout();

    const { onConfirm } = vi.mocked(modalActions.showModal).mock.calls[0][0];
    await onConfirm?.();

    await waitFor(() => expect(routerReplace).toHaveBeenCalledWith("/login"));
  });
});

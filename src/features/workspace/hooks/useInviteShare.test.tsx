import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useQuery } from "@tanstack/react-query";

import { toastActions } from "@/stores/useToastStore";
import { modalActions } from "@/stores/useModalStore";
import { useCreateInviteCodeMutation } from "@/features/workspace/queries/workspaceMutations";
import { useInviteShare } from "./useInviteShare";

import type { ModalConfig } from "@/types/modal";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/features/workspace/queries/workspaceQueries", () => ({
  workspaceQueries: { inviteCode: vi.fn() },
}));

vi.mock("@/features/workspace/queries/workspaceMutations", () => ({
  useCreateInviteCodeMutation: vi.fn(),
}));

vi.mock("@/features/workspace/utils/inviteCode", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/workspace/utils/inviteCode")>()),
  generateInviteLink: (code: string) => `https://duous.app/workspace/join/${code}`,
}));

vi.mock("@/stores/useToastStore", () => ({
  toastActions: { showToast: vi.fn() },
}));

vi.mock("@/stores/useModalStore", () => ({
  modalActions: { showModal: vi.fn() },
}));

Object.defineProperty(navigator, "clipboard", {
  value: { writeText: vi.fn() },
  configurable: true,
});

const mockUseQuery = vi.mocked(useQuery);

describe("useInviteShare", () => {
  const createInviteCodeMutateAsync = vi.fn();

  /** 현재 발급된 코드를 반환하도록 쿼리 결과를 세팅한다 */
  const setCode = (code: string | null) => {
    mockUseQuery.mockReturnValue({ data: code, isPending: false } as unknown as ReturnType<
      typeof useQuery
    >);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setCode("K7M2P9QX");
    vi.mocked(useCreateInviteCodeMutation).mockReturnValue({
      mutateAsync: createInviteCodeMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateInviteCodeMutation>);
  });

  it("코드를 하이픈 표기로 노출한다", () => {
    const { result } = renderHook(() => useInviteShare("workspace-1"));

    expect(result.current.displayCode).toBe("K7M2-P9QX");
  });

  it("코드가 없으면 표시 코드가 빈 문자열이다", () => {
    setCode(null);
    const { result } = renderHook(() => useInviteShare("workspace-1"));

    expect(result.current.displayCode).toBe("");
  });

  it("copyCode는 하이픈 표기 코드를 복사하고 성공 토스트를 띄운다", async () => {
    const { result } = renderHook(() => useInviteShare("workspace-1"));

    await act(async () => {
      await result.current.copyCode();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("K7M2-P9QX");
    expect(toastActions.showToast).toHaveBeenCalledWith("초대 코드를 복사했습니다.", "success");
  });

  it("copyLink는 정규화된 코드로 만든 링크를 복사한다", async () => {
    const { result } = renderHook(() => useInviteShare("workspace-1"));

    await act(async () => {
      await result.current.copyLink();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "https://duous.app/workspace/join/K7M2P9QX"
    );
    expect(toastActions.showToast).toHaveBeenCalledWith("초대 링크를 복사했습니다.", "success");
  });

  it("복사 실패 시 에러 토스트를 띄운다", async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error("fail"));
    const { result } = renderHook(() => useInviteShare("workspace-1"));

    await act(async () => {
      await result.current.copyCode();
    });

    expect(toastActions.showToast).toHaveBeenCalledWith(
      "복사에 실패했습니다. 직접 입력해 전달해주세요.",
      "error"
    );
  });

  it("코드가 없으면 복사를 시도하지 않는다", async () => {
    setCode(null);
    const { result } = renderHook(() => useInviteShare("workspace-1"));

    await act(async () => {
      await result.current.copyCode();
      await result.current.copyLink();
    });

    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it("regenerate는 기존 코드가 무효화됨을 알리는 확인 모달을 먼저 띄운다", () => {
    const { result } = renderHook(() => useInviteShare("workspace-1"));

    act(() => result.current.regenerate());

    expect(modalActions.showModal).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "confirm",
        message: expect.stringContaining("사용할 수 없게 됩니다"),
      })
    );
    expect(createInviteCodeMutateAsync).not.toHaveBeenCalled();
  });

  it("확인 시에만 새 코드를 발급한다", async () => {
    createInviteCodeMutateAsync.mockResolvedValueOnce("B4N8TR3W");
    const { result } = renderHook(() => useInviteShare("workspace-1"));

    act(() => result.current.regenerate());
    const { onConfirm } = vi.mocked(modalActions.showModal).mock.calls[0][0] as ModalConfig;
    await act(async () => {
      await onConfirm?.();
    });

    expect(createInviteCodeMutateAsync).toHaveBeenCalledWith({ workspaceId: "workspace-1" });
    expect(toastActions.showToast).toHaveBeenCalledWith("새 초대 코드를 발급했습니다.", "success");
  });

  it("재발급 실패 시 에러 토스트를 띄운다", async () => {
    createInviteCodeMutateAsync.mockRejectedValueOnce(new Error("fail"));
    const { result } = renderHook(() => useInviteShare("workspace-1"));

    act(() => result.current.regenerate());
    const { onConfirm } = vi.mocked(modalActions.showModal).mock.calls[0][0] as ModalConfig;
    await act(async () => {
      await onConfirm?.();
    });

    expect(toastActions.showToast).toHaveBeenCalledWith("초대 코드 발급에 실패했습니다.", "error");
  });
});

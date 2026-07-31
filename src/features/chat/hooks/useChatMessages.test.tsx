import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { toastActions } from "@/stores/useToastStore";
import { useSendMessageMutation } from "@/features/chat/queries/chatMutations";
import { chatQueries } from "@/features/chat/queries/chatQueries";
import { useChatMessages } from "./useChatMessages";

import type { ReactNode } from "react";

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
};

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  },
}));

vi.mock("@/features/chat/queries/chatQueries", () => ({
  chatQueries: {
    list: vi.fn((workspaceId: string, userId: string) => ({
      queryKey: ["chat", "messages", workspaceId, userId],
      queryFn: vi.fn().mockResolvedValue([]),
      enabled: !!workspaceId && !!userId,
    })),
  },
}));

vi.mock("@/features/chat/queries/chatMutations", () => ({
  useSendMessageMutation: vi.fn(),
}));

vi.mock("@/stores/useToastStore", () => ({
  toastActions: { showToast: vi.fn() },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { Wrapper, queryClient };
};

describe("useChatMessages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChannel.on.mockReturnThis();
    mockChannel.subscribe.mockReturnThis();
  });

  it("초기 목록 쿼리를 불러온다", async () => {
    vi.mocked(useSendMessageMutation).mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useSendMessageMutation>);
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useChatMessages("ws-1", "me"), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.messages).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it("공백/빈 문자열 메시지는 전송하지 않는다", async () => {
    const mutate = vi.fn();
    vi.mocked(useSendMessageMutation).mockReturnValue({
      mutate,
    } as unknown as ReturnType<typeof useSendMessageMutation>);
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useChatMessages("ws-1", "me"), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.sendMessage("   ");

    expect(mutate).not.toHaveBeenCalled();
  });

  it("유효한 텍스트를 trim해서 전송한다", async () => {
    const mutate = vi.fn();
    vi.mocked(useSendMessageMutation).mockReturnValue({
      mutate,
    } as unknown as ReturnType<typeof useSendMessageMutation>);
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useChatMessages("ws-1", "me"), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.sendMessage("  안녕  ");

    expect(mutate).toHaveBeenCalledWith(
      { workspaceId: "ws-1", text: "안녕" },
      expect.objectContaining({ onError: expect.any(Function) })
    );
  });

  it("전송 실패 시 토스트를 띄우고 onError를 호출한다", async () => {
    const onError = vi.fn();
    let capturedOptions: { onError?: () => void } = {};
    const mutate = vi.fn((_, options) => {
      capturedOptions = options;
    });
    vi.mocked(useSendMessageMutation).mockReturnValue({
      mutate,
    } as unknown as ReturnType<typeof useSendMessageMutation>);
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useChatMessages("ws-1", "me"), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.sendMessage("안녕", onError);
    capturedOptions.onError?.();

    expect(toastActions.showToast).toHaveBeenCalledWith("메시지 전송에 실패했습니다.", "error");
    expect(onError).toHaveBeenCalled();
  });

  it("workspaceId나 userId가 없으면 전송하지 않는다", async () => {
    const mutate = vi.fn();
    vi.mocked(useSendMessageMutation).mockReturnValue({
      mutate,
    } as unknown as ReturnType<typeof useSendMessageMutation>);
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useChatMessages("", "me"), { wrapper: Wrapper });

    result.current.sendMessage("안녕");

    expect(mutate).not.toHaveBeenCalled();
  });

  it("workspaceId/userId가 있으면 realtime 채널을 구독한다", async () => {
    vi.mocked(useSendMessageMutation).mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useSendMessageMutation>);
    const { supabase } = await import("@/lib/supabase/client");
    const { Wrapper } = createWrapper();

    renderHook(() => useChatMessages("ws-1", "me"), { wrapper: Wrapper });

    expect(supabase.channel).toHaveBeenCalledWith("chat:ws-1");
    expect(mockChannel.on).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({ event: "INSERT", table: "messages" }),
      expect.any(Function)
    );
  });

  it("unmount 시 채널을 제거한다", async () => {
    vi.mocked(useSendMessageMutation).mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useSendMessageMutation>);
    const { supabase } = await import("@/lib/supabase/client");
    const { Wrapper } = createWrapper();

    const { unmount } = renderHook(() => useChatMessages("ws-1", "me"), { wrapper: Wrapper });
    unmount();

    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });
});

import { createRef } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { useChatMessages } from "@/features/chat/hooks/useChatMessages";
import { useChatViewport } from "@/features/chat/hooks/useChatViewport";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";

import { ChatView } from "./ChatView";

import type { ChatMessage } from "@/features/chat/types/chat";
import type { Workspace } from "@/features/workspace/types/workspace";

vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQuery: vi.fn(),
}));

vi.mock("@/features/chat/hooks/useChatMessages", () => ({
  useChatMessages: vi.fn(),
}));

vi.mock("@/features/chat/hooks/useChatViewport", () => ({
  useChatViewport: vi.fn(),
}));

vi.mock("@/features/workspace/hooks/useCurrentWorkspace", () => ({
  useCurrentWorkspace: vi.fn(),
}));

// jsdom에는 레이아웃 높이가 없어 실제 가상화가 항목을 0개로 계산하므로, 전체 항목을 그리는 스텁으로 대체한다
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({
    count,
    getItemKey,
  }: {
    count: number;
    getItemKey: (index: number) => string;
  }) => ({
    getTotalSize: () => count * 56,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: getItemKey(index),
        start: index * 56,
        size: 56,
      })),
    measureElement: () => {},
  }),
}));

const mockUseQuery = vi.mocked(useQuery);
const mockUseChatMessages = vi.mocked(useChatMessages);
const mockUseChatViewport = vi.mocked(useChatViewport);
const mockUseCurrentWorkspace = vi.mocked(useCurrentWorkspace);

const workspace = {
  id: "workspace-1",
  name: "우리집",
  members: [
    { id: "user-1", name: "홍길동" },
    { id: "user-2", name: "파트너" },
  ],
} as unknown as Workspace;

const message: ChatMessage = {
  id: "msg-1",
  text: "안녕",
  sender: "me",
  senderId: "user-1",
  time: "오후 3:04",
};

const sendMessage = vi.fn();

/** 훅 반환값을 원하는 상태로 세팅한다 */
const setChatState = (state: {
  currentWorkspace?: Workspace | null;
  isWorkspacePending?: boolean;
  messages?: ChatMessage[];
  isLoading?: boolean;
  isError?: boolean;
}) => {
  mockUseCurrentWorkspace.mockReturnValue({
    currentWorkspace: state.currentWorkspace ?? workspace,
    isPending: state.isWorkspacePending ?? false,
  } as unknown as ReturnType<typeof useCurrentWorkspace>);

  mockUseChatMessages.mockReturnValue({
    messages: state.messages ?? [],
    isLoading: state.isLoading ?? false,
    isError: state.isError ?? false,
    sendMessage,
  });
};

describe("ChatView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date("2026-08-03T15:04:00"));
    mockUseQuery.mockReturnValue({ data: { id: "user-1" } } as unknown as ReturnType<
      typeof useQuery
    >);
    mockUseChatViewport.mockReturnValue({ bottomRef: createRef<HTMLDivElement>() });
  });

  it("메시지 로딩 중에는 입력바를 렌더링하지 않는다", () => {
    setChatState({ isLoading: true });

    render(<ChatView />);

    expect(screen.queryByPlaceholderText("메시지...")).not.toBeInTheDocument();
  });

  it("메시지 조회 실패 시 에러 안내를 렌더링한다", () => {
    setChatState({ isError: true });

    render(<ChatView />);

    expect(screen.getByText("메시지를 불러오지 못했습니다.")).toBeInTheDocument();
  });

  it("파트너가 없으면 채팅 UI 대신 빈 상태를 렌더링한다", () => {
    setChatState({
      currentWorkspace: { ...workspace, members: [{ id: "user-1", name: "홍길동" }] } as Workspace,
    });

    render(<ChatView />);

    expect(screen.getByText("아직 파트너가 없어요")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("메시지...")).not.toBeInTheDocument();
  });

  it("워크스페이스 로딩 중에는 빈 상태 대신 로딩 스피너를 노출한다", () => {
    setChatState({ currentWorkspace: null, isWorkspacePending: true });

    render(<ChatView />);

    expect(screen.queryByText("아직 파트너가 없어요")).not.toBeInTheDocument();
    expect(screen.getByRole("status", { name: "로딩 중" })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("메시지...")).not.toBeInTheDocument();
  });

  it("파트너가 있으면 헤더·메시지·입력바를 렌더링한다", () => {
    setChatState({ messages: [message] });

    render(<ChatView />);

    expect(screen.getByText("파트너")).toBeInTheDocument();
    expect(screen.getByText("안녕")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("메시지...")).toBeInTheDocument();
  });

  it("입력값을 전송하면 sendMessage를 호출하고 입력바를 비운다", () => {
    setChatState({});

    render(<ChatView />);
    const input = screen.getByPlaceholderText("메시지...");
    fireEvent.change(input, { target: { value: "하이" } });
    fireEvent.click(screen.getByRole("button", { name: "메시지 전송" }));

    expect(sendMessage).toHaveBeenCalledWith("하이", expect.any(Function));
    expect(input).toHaveValue("");
  });

  it("전송이 실패하면 입력값을 복원한다", () => {
    setChatState({});

    render(<ChatView />);
    const input = screen.getByPlaceholderText("메시지...");
    fireEvent.change(input, { target: { value: "하이" } });
    fireEvent.click(screen.getByRole("button", { name: "메시지 전송" }));

    // 실제 전송은 비동기이므로, 전송 후 시점에 실패 콜백이 호출되는 상황을 재현한다
    const [, onError] = sendMessage.mock.calls[0] as [string, () => void];
    act(() => onError());

    expect(screen.getByPlaceholderText("메시지...")).toHaveValue("하이");
  });

  it("현재 워크스페이스와 사용자 id로 메시지 훅을 호출한다", () => {
    setChatState({});

    render(<ChatView />);

    expect(mockUseChatMessages).toHaveBeenCalledWith("workspace-1", "user-1");
  });
});

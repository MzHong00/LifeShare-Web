import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MessageList } from "./MessageList";

import type { ChatMessage } from "@/features/chat/types/chat";
import type { WorkspaceMember } from "@/features/workspace/types/workspace";

const ITEM_HEIGHT = 56;

// jsdom에는 레이아웃 높이가 없어 실제 가상화가 항목을 0개로 계산하므로, 전체 항목을 그리는 스텁으로 대체한다
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({
    count,
    getItemKey,
  }: {
    count: number;
    getItemKey: (index: number) => string;
  }) => ({
    getTotalSize: () => count * ITEM_HEIGHT,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: getItemKey(index),
        start: index * ITEM_HEIGHT,
        size: ITEM_HEIGHT,
      })),
    measureElement: () => {},
  }),
}));

/** 채팅 메시지 목업을 만든다 */
const createMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: "msg-1",
  text: "안녕",
  sender: "me",
  senderId: "user-1",
  time: "오후 3:04",
  ...overrides,
});

const members = [
  { id: "user-2", name: "파트너", avatar: "https://cdn.test/a.png" },
] as unknown as WorkspaceMember[];

/** 기본 props로 목록을 렌더링한다 */
const renderList = (props: Partial<React.ComponentProps<typeof MessageList>> = {}) =>
  render(<MessageList messages={[]} bottomRef={createRef<HTMLDivElement>()} {...props} />);

describe("MessageList", () => {
  it("조회 실패 시 에러 안내를 렌더링한다", () => {
    renderList({ isError: true, messages: [createMessage()] });

    expect(screen.getByText("메시지를 불러오지 못했습니다.")).toBeInTheDocument();
    expect(screen.queryByText("안녕")).not.toBeInTheDocument();
  });

  it("로딩 중이면 메시지 대신 스피너를 렌더링한다", () => {
    renderList({ isLoading: true, messages: [createMessage()] });

    expect(screen.queryByText("안녕")).not.toBeInTheDocument();
  });

  it("메시지가 없으면 말풍선을 하나도 렌더링하지 않는다", () => {
    const { container } = renderList({ messages: [] });

    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("메시지 목록을 순서대로 렌더링한다", () => {
    renderList({
      messages: [
        createMessage({ id: "msg-1", text: "첫 메시지" }),
        createMessage({ id: "msg-2", text: "두 번째 메시지", time: "오후 3:05" }),
      ],
    });

    expect(screen.getByText("첫 메시지")).toBeInTheDocument();
    expect(screen.getByText("두 번째 메시지")).toBeInTheDocument();
  });

  it("상대 메시지는 발신자 멤버의 아바타로 렌더링한다", () => {
    renderList({
      messages: [
        createMessage({ id: "msg-1", text: "상대 메시지", sender: "partner", senderId: "user-2" }),
      ],
      members,
    });

    expect(screen.getByAltText("파트너")).toBeInTheDocument();
  });

  it("내 메시지에는 발신자 아바타를 렌더링하지 않는다", () => {
    renderList({
      messages: [createMessage({ id: "msg-1", text: "내 메시지", senderId: "user-1" })],
      members,
    });

    expect(screen.queryByAltText("파트너")).not.toBeInTheDocument();
  });

  it("멤버 목록에 없는 발신자는 알 수 없음으로 표시한다", () => {
    renderList({
      messages: [
        createMessage({ id: "msg-1", text: "탈퇴자 메시지", sender: "partner", senderId: "gone" }),
      ],
      members,
    });

    expect(screen.getByText("알")).toBeInTheDocument();
  });

  it("같은 발신자·같은 시간의 연속 메시지는 마지막 것에만 시간을 표시한다", () => {
    renderList({
      messages: [
        createMessage({ id: "msg-1", text: "첫 메시지" }),
        createMessage({ id: "msg-2", text: "두 번째 메시지" }),
      ],
    });

    expect(screen.getAllByText("오후 3:04")).toHaveLength(1);
  });

  it("시간이 다른 메시지는 각각 시간을 표시한다", () => {
    renderList({
      messages: [
        createMessage({ id: "msg-1", text: "첫 메시지", time: "오후 3:04" }),
        createMessage({ id: "msg-2", text: "두 번째 메시지", time: "오후 3:05" }),
      ],
    });

    expect(screen.getByText("오후 3:04")).toBeInTheDocument();
    expect(screen.getByText("오후 3:05")).toBeInTheDocument();
  });

  it("하단 앵커에 bottomRef를 연결한다", () => {
    const bottomRef = createRef<HTMLDivElement>();
    renderList({ bottomRef, messages: [createMessage()] });

    expect(bottomRef.current).toBeInstanceOf(HTMLDivElement);
  });
});

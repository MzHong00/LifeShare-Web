import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MessageBubble } from "./MessageBubble";

import type { ChatMessage } from "@/features/chat/types/chat";

/** 기본 props에 덮어쓰기를 적용해 렌더링한다 */
const renderBubble = (
  overrides: Partial<{
    text: string;
    sender: ChatMessage["sender"];
    time: string;
    avatar?: string;
    name?: string;
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
  }> = {}
) =>
  render(
    <MessageBubble
      text="안녕"
      sender="me"
      time="오후 3:04"
      isFirstInGroup
      isLastInGroup
      {...overrides}
    />
  );

describe("MessageBubble", () => {
  it("메시지 텍스트를 렌더링한다", () => {
    renderBubble({ text: "밥 먹었어?" });

    expect(screen.getByText("밥 먹었어?")).toBeInTheDocument();
  });

  it("내 메시지는 상대 아바타 없이 렌더링한다", () => {
    renderBubble({ sender: "me", name: "파트너", avatar: "https://cdn.test/a.png" });

    expect(screen.queryByAltText("파트너")).not.toBeInTheDocument();
  });

  it("상대 메시지의 그룹 첫 메시지에는 아바타를 렌더링한다", () => {
    renderBubble({
      sender: "partner",
      name: "파트너",
      avatar: "https://cdn.test/a.png",
      isFirstInGroup: true,
    });

    expect(screen.getByAltText("파트너")).toBeInTheDocument();
  });

  it("상대 메시지의 그룹 중간 메시지에는 아바타를 렌더링하지 않는다", () => {
    renderBubble({
      sender: "partner",
      name: "파트너",
      avatar: "https://cdn.test/a.png",
      isFirstInGroup: false,
    });

    expect(screen.queryByAltText("파트너")).not.toBeInTheDocument();
  });

  it("상대 이름이 없으면 이니셜 폴백 문자를 표시한다", () => {
    renderBubble({ sender: "partner", name: undefined, isFirstInGroup: true });

    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("그룹 마지막 메시지에는 시간을 표시한다", () => {
    renderBubble({ time: "오후 3:04", isLastInGroup: true });

    expect(screen.getByText("오후 3:04")).toBeInTheDocument();
  });

  it("그룹 마지막이 아니면 시간을 표시하지 않는다", () => {
    renderBubble({ time: "오후 3:04", isLastInGroup: false });

    expect(screen.queryByText("오후 3:04")).not.toBeInTheDocument();
  });

  it("상대 메시지도 그룹 마지막이면 시간을 표시한다", () => {
    renderBubble({ sender: "partner", name: "파트너", time: "오후 3:05", isLastInGroup: true });

    expect(screen.getByText("오후 3:05")).toBeInTheDocument();
  });
});

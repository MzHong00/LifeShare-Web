import { afterEach, describe, expect, it, vi } from "vitest";

import { chatApi, rowToChatMessage } from "@/features/chat/api/chat";

import { mockFetch } from "@/lib/api/mockFetch";

import type { ChatMessage } from "@/features/chat/types/chat";

const messageRow = {
  id: "message-1",
  workspace_id: "workspace-1",
  sender_id: "user-1",
  text: "안녕",
  created_at: "2026-07-01T00:00:00Z",
};

const chatMessage: ChatMessage = {
  id: "message-1",
  text: "안녕",
  sender: "me",
  senderId: "user-1",
  time: "오전 09:00",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("rowToChatMessage", () => {
  it("sender_id가 userId와 같으면 sender를 me로 변환한다", () => {
    const result = rowToChatMessage(messageRow, "user-1");

    expect(result).toEqual(
      expect.objectContaining({ id: "message-1", text: "안녕", sender: "me", senderId: "user-1" })
    );
  });

  it("sender_id가 userId와 다르면 sender를 partner로 변환한다", () => {
    const result = rowToChatMessage(messageRow, "user-2");

    expect(result.sender).toBe("partner");
  });
});

describe("chatApi.list", () => {
  it("workspaceId·userId 쿼리로 GET /api/messages를 호출하고 목록을 반환한다", async () => {
    const fetchSpy = mockFetch(200, [chatMessage]);

    const result = await chatApi.list("workspace-1");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/messages?workspaceId=workspace-1",
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    );
    expect(result).toEqual([chatMessage]);
  });

  it("조회 실패 시 에러를 throw한다", async () => {
    mockFetch(500, { message: "메시지 목록 조회에 실패했습니다." });

    await expect(chatApi.list("workspace-1")).rejects.toThrow("메시지 목록 조회에 실패했습니다.");
  });
});

describe("chatApi.send", () => {
  it("POST /api/messages로 메시지 전송 요청을 보낸다", async () => {
    const fetchSpy = mockFetch(204, null);

    await chatApi.send("workspace-1", "안녕");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/messages",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ workspaceId: "workspace-1", text: "안녕" }),
      })
    );
  });

  it("전송 실패 시 에러를 throw한다", async () => {
    mockFetch(500, { message: "메시지 전송에 실패했습니다." });

    await expect(chatApi.send("workspace-1", "안녕")).rejects.toThrow(
      "메시지 전송에 실패했습니다."
    );
  });
});

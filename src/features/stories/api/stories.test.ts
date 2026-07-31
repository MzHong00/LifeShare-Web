import { afterEach, describe, expect, it, vi } from "vitest";

import { storiesApi } from "@/features/stories/api/stories";

import { mockFetch } from "@/lib/api/mockFetch";

import type { Story } from "@/features/stories/types/story";

const story: Story = {
  id: "story-1",
  workspaceId: "workspace-1",
  userId: "user-1",
  title: "제목",
  description: "설명",
  date: "2026-07-01",
  thumbnailUrl: "https://example.com/thumb.png",
  path: [],
  pathColor: "#fff",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("storiesApi.list", () => {
  it("workspaceId 쿼리로 GET /api/stories를 호출하고 목록을 반환한다", async () => {
    const fetchSpy = mockFetch(200, [story]);

    const result = await storiesApi.list("workspace-1");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/stories?workspaceId=workspace-1",
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    );
    expect(result).toEqual([story]);
  });

  it("조회 실패 시 에러를 throw한다", async () => {
    mockFetch(500, { message: "스토리 목록 조회에 실패했습니다." });

    await expect(storiesApi.list("workspace-1")).rejects.toThrow(
      "스토리 목록 조회에 실패했습니다."
    );
  });
});

describe("storiesApi.create", () => {
  it("POST /api/stories로 생성 요청을 보내고 생성된 스토리를 반환한다", async () => {
    const fetchSpy = mockFetch(201, story);
    const { id: _id, ...createInput } = story;

    const result = await storiesApi.create(createInput);

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/stories",
      expect.objectContaining({ method: "POST", body: JSON.stringify(createInput) })
    );
    expect(result).toEqual(story);
  });

  it("생성 실패 시 에러를 throw한다", async () => {
    mockFetch(500, { message: "스토리 생성에 실패했습니다." });
    const { id: _id, ...createInput } = story;

    await expect(storiesApi.create(createInput)).rejects.toThrow("스토리 생성에 실패했습니다.");
  });
});

describe("storiesApi.update", () => {
  it("PATCH /api/stories/[id]로 변경 필드를 보내고 수정된 스토리를 반환한다", async () => {
    const fetchSpy = mockFetch(200, { ...story, title: "수정된 제목" });

    const result = await storiesApi.update("story-1", { title: "수정된 제목" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/stories/story-1",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ title: "수정된 제목" }) })
    );
    expect(result.title).toBe("수정된 제목");
  });

  it("수정 실패 시 에러를 throw한다", async () => {
    mockFetch(500, { message: "스토리 수정에 실패했습니다." });

    await expect(storiesApi.update("story-1", { title: "수정된 제목" })).rejects.toThrow(
      "스토리 수정에 실패했습니다."
    );
  });
});

describe("storiesApi.delete", () => {
  it("DELETE /api/stories/[id]로 삭제 요청을 보낸다", async () => {
    const fetchSpy = mockFetch(204, null);

    await storiesApi.delete("story-1");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/stories/story-1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("삭제 실패 시 에러를 throw한다", async () => {
    mockFetch(500, { message: "스토리 삭제에 실패했습니다." });

    await expect(storiesApi.delete("story-1")).rejects.toThrow("스토리 삭제에 실패했습니다.");
  });
});

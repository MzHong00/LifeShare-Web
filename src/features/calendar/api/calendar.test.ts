import { afterEach, describe, expect, it, vi } from "vitest";

import { calendarApi } from "@/features/calendar/api/calendar";

import { mockFetch } from "@/lib/api/mockFetch";

import type { CalendarEvent } from "@/features/calendar/types/calendar";

const event: CalendarEvent = {
  id: "event-1",
  workspaceId: "workspace-1",
  title: "생일",
  description: "설명",
  startDate: "2026-07-01",
  endDate: "2026-07-02",
  startTime: "10:00",
  endTime: "11:00",
  isAllDay: false,
  color: "#fff",
  createdAt: "2026-07-01T00:00:00Z",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("calendarApi.list", () => {
  it("workspaceId 쿼리로 GET /api/calendar-events를 호출하고 목록을 반환한다", async () => {
    const fetchSpy = mockFetch(200, [event]);

    const result = await calendarApi.list("workspace-1");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/calendar-events?workspaceId=workspace-1",
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    );
    expect(result).toEqual([event]);
  });

  it("조회 실패 시 에러를 throw한다", async () => {
    mockFetch(500, { message: "일정 목록 조회에 실패했습니다." });

    await expect(calendarApi.list("workspace-1")).rejects.toThrow("일정 목록 조회에 실패했습니다.");
  });
});

describe("calendarApi.create", () => {
  it("POST /api/calendar-events로 생성 요청을 보내고 생성된 일정을 반환한다", async () => {
    const fetchSpy = mockFetch(201, event);
    const { id: _id, createdAt: _createdAt, ...createInput } = event;

    const result = await calendarApi.create(createInput);

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/calendar-events",
      expect.objectContaining({ method: "POST", body: JSON.stringify(createInput) })
    );
    expect(result).toEqual(event);
  });

  it("생성 실패 시 에러를 throw한다", async () => {
    mockFetch(500, { message: "일정 생성에 실패했습니다." });
    const { id: _id, createdAt: _createdAt, ...createInput } = event;

    await expect(calendarApi.create(createInput)).rejects.toThrow("일정 생성에 실패했습니다.");
  });
});

describe("calendarApi.update", () => {
  it("PATCH /api/calendar-events/[id]로 변경 필드를 보내고 수정된 일정을 반환한다", async () => {
    const fetchSpy = mockFetch(200, { ...event, title: "수정된 일정" });

    const result = await calendarApi.update("event-1", { title: "수정된 일정" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/calendar-events/event-1",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ title: "수정된 일정" }) })
    );
    expect(result.title).toBe("수정된 일정");
  });

  it("수정 실패 시 에러를 throw한다", async () => {
    mockFetch(500, { message: "일정 수정에 실패했습니다." });

    await expect(calendarApi.update("event-1", { title: "수정된 일정" })).rejects.toThrow(
      "일정 수정에 실패했습니다."
    );
  });
});

describe("calendarApi.delete", () => {
  it("DELETE /api/calendar-events/[id]로 삭제 요청을 보낸다", async () => {
    const fetchSpy = mockFetch(204, null);

    await calendarApi.delete("event-1");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/calendar-events/event-1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("삭제 실패 시 에러를 throw한다", async () => {
    mockFetch(500, { message: "일정 삭제에 실패했습니다." });

    await expect(calendarApi.delete("event-1")).rejects.toThrow("일정 삭제에 실패했습니다.");
  });
});

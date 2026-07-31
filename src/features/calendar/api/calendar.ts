import { bffFetch } from "@/lib/api/bffClient";

import type { CalendarEvent, CreateEventData } from "@/features/calendar/types/calendar";

export const calendarApi = {
  list: async (workspaceId: string): Promise<CalendarEvent[]> =>
    bffFetch<CalendarEvent[]>(
      `/api/calendar-events?workspaceId=${encodeURIComponent(workspaceId)}`,
      "일정 목록 조회에 실패했습니다."
    ),

  create: async (eventData: CreateEventData): Promise<CalendarEvent> =>
    bffFetch<CalendarEvent>("/api/calendar-events", "일정 생성에 실패했습니다.", {
      method: "POST",
      body: JSON.stringify(eventData),
    }),

  update: async (
    id: string,
    updates: Partial<Omit<CalendarEvent, "id" | "workspaceId" | "createdAt">>
  ): Promise<CalendarEvent> =>
    bffFetch<CalendarEvent>(
      `/api/calendar-events/${encodeURIComponent(id)}`,
      "일정 수정에 실패했습니다.",
      {
        method: "PATCH",
        body: JSON.stringify(updates),
      }
    ),

  delete: async (id: string): Promise<void> =>
    bffFetch<void>(`/api/calendar-events/${encodeURIComponent(id)}`, "일정 삭제에 실패했습니다.", {
      method: "DELETE",
    }),
};

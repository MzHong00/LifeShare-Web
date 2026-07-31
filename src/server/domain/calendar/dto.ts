/** 일정 생성 요청 본문 */
export interface CalendarEventCreateRequestDto {
  workspaceId: string; // 소속 워크스페이스 ID
  title: string; // 제목
  description?: string; // 설명
  startDate: string; // 시작일 (ISO)
  endDate: string; // 종료일 (ISO)
  startTime?: string; // 시작 시각 (HH:mm)
  endTime?: string; // 종료 시각 (HH:mm)
  isAllDay: boolean; // 종일 일정 여부
  color: string; // 표시 색상
}

/** 일정 수정 요청 본문 (변경할 필드만 전달) */
export interface CalendarEventUpdateRequestDto {
  title?: string; // 제목
  description?: string; // 설명
  startDate?: string; // 시작일 (ISO)
  endDate?: string; // 종료일 (ISO)
  startTime?: string; // 시작 시각 (HH:mm)
  endTime?: string; // 종료 시각 (HH:mm)
  isAllDay?: boolean; // 종일 일정 여부
  color?: string; // 표시 색상
}

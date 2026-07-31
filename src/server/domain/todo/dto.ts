/** 할 일 생성 요청 본문 */
export interface TodoCreateRequestDto {
  workspaceId: string; // 소속 워크스페이스 ID
  title: string; // 제목
  description?: string; // 설명
  isCompleted: boolean; // 완료 여부
  assigneeId?: string; // 담당자 ID
  startDate: string; // 시작일 (ISO)
  endDate: string; // 종료일 (ISO)
  color?: string; // 표시 색상
}

/** 할 일 수정 요청 본문 (변경할 필드만 전달) */
export interface TodoUpdateRequestDto {
  title?: string; // 제목
  description?: string; // 설명
  isCompleted?: boolean; // 완료 여부
  assigneeId?: string; // 담당자 ID
  startDate?: string; // 시작일 (ISO)
  endDate?: string; // 종료일 (ISO)
  color?: string; // 표시 색상
}

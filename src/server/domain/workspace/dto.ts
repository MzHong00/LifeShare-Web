import type { RoomType, ThemeColor } from "@/features/workspace/types/workspace";

/** 워크스페이스 생성 요청 본문 (생성자는 세션에서 확정) */
export interface WorkspaceCreateRequestDto {
  name: string; // 워크스페이스 이름
  type: RoomType; // 방 유형
  startDate?: string; // 시작일 (ISO)
}

/** 워크스페이스 수정 요청 본문 (변경할 필드만 전달) */
export interface WorkspaceUpdateRequestDto {
  name?: string; // 워크스페이스 이름
  startDate?: string; // 시작일 (ISO)
  themeColor?: ThemeColor; // 테마 색상
}

/** 멤버 프로필 수정 요청 본문 */
export interface MemberUpdateRequestDto {
  displayName?: string; // 표시 이름
  avatarUrl?: string; // 프로필 이미지 URL
}

/** 초대 코드 생성 응답 */
export interface InviteCodeCreateResponseDto {
  code: string; // 발급된 초대 코드
}

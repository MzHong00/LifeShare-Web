export type RoomType = "couple" | "group"; // 워크스페이스 유형: 커플 / 단체
export type ThemeColor = "pink" | "blue" | "twilight" | "yellow" | "green"; // 워크스페이스 전역 색상 테마

export type MemberRole = "owner" | "member"; // owner만 초대 발급·재발급·강퇴가 가능하다

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: MemberRole; // 워크스페이스 내 권한
}

/**
 * 초대 코드로 볼 수 있는 라이프룸 요약.
 * 초대받은 사람은 아직 멤버가 아니라 라이프룸 전체를 읽을 수 없으므로,
 * 참여 여부를 판단할 최소 정보만 서버가 내려준다 (멤버 목록·기록은 포함하지 않는다).
 */
export interface WorkspaceInvitePreview {
  id: string;
  name: string;
  type: RoomType;
  memberCount: number; // 현재 참여 인원
}

export interface Workspace {
  id: string;
  name: string;
  type: RoomType;
  startDate?: string;
  backgroundImage?: string;
  partnerName?: string;
  members?: WorkspaceMember[];
  themeColor: ThemeColor;
}

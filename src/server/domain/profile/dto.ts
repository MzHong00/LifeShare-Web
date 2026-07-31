/** 프로필 수정 요청 본문 (변경할 필드만 전달) */
export interface ProfileUpdateRequestDto {
  name?: string; // 표시 이름
  profileImage?: string; // 프로필 이미지 URL
}

/** 프로필 upsert 시 변경할 필드만 전달 */
export interface ProfileUpsertInputDto {
  name?: string;
  avatarUrl?: string;
}

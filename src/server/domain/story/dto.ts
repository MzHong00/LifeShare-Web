import type { Story } from "@/features/stories/types/story";

/** 스토리 생성 요청 본문 (userId는 세션에서 확정하므로 무시된다) */
export type StoryCreateRequestDto = Omit<Story, "id">;

/** 스토리 수정 요청 본문 (변경할 필드만 전달) */
export type StoryUpdateRequestDto = Partial<
  Pick<Story, "title" | "description" | "date" | "thumbnailUrl" | "path" | "pathColor">
>;

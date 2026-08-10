import type { Story } from "@/features/stories/types/story";

export const SHELL_ID_PREFIX = "shell-story-"; // 껍데기 스토리 id 접두어(실데이터와 구분)

/** 해당 스토리가 실데이터가 아닌 껍데기(예시) 스토리인지 판별 */
export const isShellStory = (story: Story): boolean => story.id.startsWith(SHELL_ID_PREFIX);

const SHELL_MAX_COUNT = 20; // 스토리 보드를 채우는 껍데기 최대 개수(부채꼴 5장 + 흩어진 카드 15장)

/**
 * 홈 콜라주 보드가 허전하지 않도록 실제 스토리 개수의 부족분을 채우는 껍데기 스토리를 count개 생성.
 * 사진만 있고 제목은 "예시", 날짜는 없는 플레이스홀더라 실제 기억이 늘면 그만큼 밀려나 사라진다.
 */
export const createShellStories = (workspaceId: string, count: number): Story[] =>
  Array.from({ length: Math.max(0, Math.min(count, SHELL_MAX_COUNT)) }, (_, index) => ({
    id: `${SHELL_ID_PREFIX}${index}`,
    title: "예시", // 껍데기임을 제목으로 명시
    date: "", // 껍데기라 날짜 없음(날짜 배지·상세 날짜 모두 숨겨짐)
    path: [],
    pathColor: "#3182f6",
    thumbnailUrl: `https://picsum.photos/seed/lifeshare-shell-${index}/400/533`, // 예시용 임의 사진
    userId: "shell-user",
    workspaceId,
  }));

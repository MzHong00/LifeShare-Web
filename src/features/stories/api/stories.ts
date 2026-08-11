import { bffFetch } from "@/lib/api/bffClient";

import type { Story } from "@/features/stories/types/story";
import type { StoryCreateRequestDto, StoryUpdateRequestDto } from "@/server/domain/story/dto";

export const storiesApi = {
  list: async (workspaceId: string): Promise<Story[]> =>
    bffFetch<Story[]>(
      `/api/stories?workspaceId=${encodeURIComponent(workspaceId)}`,
      "스토리 목록 조회에 실패했습니다."
    ),

  create: async (story: StoryCreateRequestDto): Promise<Story> =>
    bffFetch<Story>("/api/stories", "스토리 생성에 실패했습니다.", {
      method: "POST",
      body: JSON.stringify(story),
    }),

  update: async (id: string, data: StoryUpdateRequestDto): Promise<Story> =>
    bffFetch<Story>(`/api/stories/${encodeURIComponent(id)}`, "스토리 수정에 실패했습니다.", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: async (id: string): Promise<void> =>
    bffFetch<void>(`/api/stories/${encodeURIComponent(id)}`, "스토리 삭제에 실패했습니다.", {
      method: "DELETE",
    }),
};

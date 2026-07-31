import { bffFetch } from "@/lib/api/bffClient";

import type { User } from "@/types/user";

export const profileApi = {
  // 비로그인 등으로 조회에 실패하면 null을 반환한다 (재시도로 인한 불필요한 요청 방지, BFF 경유)
  getProfile: async (): Promise<User | null> => {
    try {
      return await bffFetch<User>("/api/profile", "사용자 정보를 불러오지 못했습니다.");
    } catch {
      return null;
    }
  },

  // 최초 로그인 시(profiles row 없음) 구글 메타데이터로 profiles를 생성한다. 로그인 콜백에서 1회 호출된다 (BFF 경유)
  createProfile: async (): Promise<void> =>
    bffFetch<void>("/api/profile", "프로필 초기화에 실패했습니다.", { method: "POST" }),

  // 이름·프로필 이미지를 영속화하고, 참여 중인 모든 라이프룸의 멤버 정보에도 동기화한다 (BFF 경유)
  updateProfile: async (updates: { name?: string; profileImage?: string }): Promise<void> =>
    bffFetch<void>("/api/profile", "프로필 수정에 실패했습니다.", {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),
};

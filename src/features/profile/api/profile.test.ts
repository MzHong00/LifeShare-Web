import { beforeEach, describe, expect, it, vi } from "vitest";

import { profileApi } from "@/features/profile/api/profile";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("profileApi.getProfile", () => {
  it("/api/profile을 GET으로 조회해 User를 반환한다", async () => {
    const user = { id: "user-1", name: "커스텀이름", email: "test@example.com" };
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify(user), { status: 200 }));

    const result = await profileApi.getProfile();

    expect(fetchSpy).toHaveBeenCalledWith("/api/profile", expect.objectContaining({}));
    expect(result).toEqual(user);
  });

  it("조회 실패(비로그인 등) 시 null을 반환한다", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "로그인이 필요합니다." }), { status: 401 })
    );

    const result = await profileApi.getProfile();

    expect(result).toBeNull();
  });
});

describe("profileApi.createProfile", () => {
  it("/api/profile로 POST 요청을 보낸다", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await profileApi.createProfile();

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/profile",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("profileApi.updateProfile", () => {
  it("/api/profile로 PATCH 요청을 보낸다 (BFF 경유, 라이프룸 멤버 정보까지 동기화)", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await profileApi.updateProfile({ name: "새이름", profileImage: "https://example.com/new.png" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/profile",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ name: "새이름", profileImage: "https://example.com/new.png" }),
      })
    );
  });

  it("업데이트 실패 시 에러를 throw한다", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "프로필 수정에 실패했습니다." }), { status: 500 })
    );

    await expect(profileApi.updateProfile({ name: "새이름" })).rejects.toThrow(
      "프로필 수정에 실패했습니다."
    );
  });
});

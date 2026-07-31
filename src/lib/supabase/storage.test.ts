import { beforeEach, describe, expect, it, vi } from "vitest";

import { storageApi } from "@/lib/supabase/storage";

const { mockUpload, mockGetPublicUrl, mockRemove, mockFrom } = vi.hoisted(() => {
  const mockUpload = vi.fn();
  const mockGetPublicUrl = vi.fn();
  const mockRemove = vi.fn();
  const mockFrom = vi.fn((_bucket: string) => ({
    upload: mockUpload,
    getPublicUrl: mockGetPublicUrl,
    remove: mockRemove,
  }));
  return { mockUpload, mockGetPublicUrl, mockRemove, mockFrom };
});

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    storage: {
      from: mockFrom,
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("storageApi.uploadImage", () => {
  it("파일 확장자를 유지한 경로로 업로드하고 public URL을 반환한다", async () => {
    mockUpload.mockResolvedValueOnce({ error: null });
    mockGetPublicUrl.mockReturnValueOnce({
      data: { publicUrl: "https://example.com/memories/user-1/123.png" },
    });

    const file = new File(["content"], "photo.png", { type: "image/png" });
    const result = await storageApi.uploadImage(file, "user-1");

    expect(mockFrom).toHaveBeenCalledWith("memories");
    expect(mockUpload).toHaveBeenCalledWith(expect.stringMatching(/^user-1\/\d+\.png$/), file, {
      upsert: false,
    });
    expect(result).toBe("https://example.com/memories/user-1/123.png");
  });

  it("확장자가 비어있으면 jpg로 폴백한다", async () => {
    mockUpload.mockResolvedValueOnce({ error: null });
    mockGetPublicUrl.mockReturnValueOnce({ data: { publicUrl: "url" } });

    const file = new File(["content"], "photo.", { type: "image/jpeg" });
    await storageApi.uploadImage(file, "user-1");

    expect(mockUpload).toHaveBeenCalledWith(expect.stringMatching(/^user-1\/\d+\.jpg$/), file, {
      upsert: false,
    });
  });

  it("확장자에 허용되지 않는 문자가 있으면 jpg로 폴백한다", async () => {
    mockUpload.mockResolvedValueOnce({ error: null });
    mockGetPublicUrl.mockReturnValueOnce({ data: { publicUrl: "url" } });

    const file = new File(["content"], "a/b", { type: "image/jpeg" });
    await storageApi.uploadImage(file, "user-1");

    expect(mockUpload).toHaveBeenCalledWith(expect.stringMatching(/^user-1\/\d+\.jpg$/), file, {
      upsert: false,
    });
  });

  it("업로드 실패 시 에러를 throw한다", async () => {
    const uploadError = new Error("upload failed");
    mockUpload.mockResolvedValueOnce({ error: uploadError });

    const file = new File(["content"], "photo.png", { type: "image/png" });

    await expect(storageApi.uploadImage(file, "user-1")).rejects.toThrow("upload failed");
    expect(mockGetPublicUrl).not.toHaveBeenCalled();
  });
});

describe("storageApi.deleteImage", () => {
  it("publicUrl에서 path를 추출해 삭제 요청을 보낸다", async () => {
    mockRemove.mockResolvedValueOnce({ error: null });

    await storageApi.deleteImage("https://example.com/storage/v1/memories/user-1/123.png");

    expect(mockFrom).toHaveBeenCalledWith("memories");
    expect(mockRemove).toHaveBeenCalledWith(["user-1/123.png"]);
  });

  it("publicUrl에 버킷 경로가 없으면 삭제 요청을 보내지 않는다", async () => {
    await storageApi.deleteImage("https://example.com/invalid-url");

    expect(mockRemove).not.toHaveBeenCalled();
  });
});

import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { resizeImageFile } from "@/utils/imageResize";
import { useStoryImageField } from "./useStoryImageField";

vi.mock("@/utils/imageResize", () => ({
  resizeImageFile: vi.fn((file: File) => Promise.resolve(file)),
}));

const makeChangeEvent = (file: File | null) =>
  ({
    target: { files: file ? [file] : [], value: "x" },
  }) as unknown as React.ChangeEvent<HTMLInputElement>;

describe("useStoryImageField", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  it("초기 썸네일 URL로 thumbnailUrl·previewUrl을 초기화한다", () => {
    const { result } = renderHook(() => useStoryImageField("https://example.com/thumb.jpg"));

    expect(result.current.thumbnailUrl).toBe("https://example.com/thumb.jpg");
    expect(result.current.previewUrl).toBe("https://example.com/thumb.jpg");
    expect(result.current.pendingFile).toBeNull();
  });

  it("handleImageSelect 시 파일이 없으면 아무 것도 하지 않는다", async () => {
    const { result } = renderHook(() => useStoryImageField(undefined));

    await act(async () => {
      await result.current.handleImageSelect(makeChangeEvent(null));
    });

    expect(resizeImageFile).not.toHaveBeenCalled();
    expect(result.current.previewUrl).toBeUndefined();
  });

  it("handleImageSelect 시 리사이징된 파일로 미리보기 blob URL을 만들고 pendingFile을 채운다", async () => {
    const { result } = renderHook(() => useStoryImageField(undefined));
    const file = new File(["content"], "photo.png", { type: "image/png" });

    await act(async () => {
      await result.current.handleImageSelect(makeChangeEvent(file));
    });

    expect(resizeImageFile).toHaveBeenCalledWith(file);
    expect(result.current.previewUrl).toBe("blob:mock-url");
    expect(result.current.pendingFile).toBe(file);
  });

  it("이전 선택이 늦게 끝나도 최신 선택 결과를 덮어쓰지 않는다(레이스 컨디션 방지)", async () => {
    let resolveFirst: (file: File) => void = () => {};
    const firstResizePromise = new Promise<File>((resolve) => {
      resolveFirst = resolve;
    });
    const firstFile = new File(["a"], "first.png", { type: "image/png" });
    const secondFile = new File(["b"], "second.png", { type: "image/png" });

    vi.mocked(resizeImageFile)
      .mockImplementationOnce(() => firstResizePromise)
      .mockImplementationOnce((file: File) => Promise.resolve(file));

    const { result } = renderHook(() => useStoryImageField(undefined));

    // 첫 번째 선택 시작(아직 resolve 안 됨)
    let firstSelectPromise!: Promise<void>;
    act(() => {
      firstSelectPromise = result.current.handleImageSelect(makeChangeEvent(firstFile));
    });

    // 두 번째 선택이 먼저 완료됨
    await act(async () => {
      await result.current.handleImageSelect(makeChangeEvent(secondFile));
    });
    expect(result.current.pendingFile).toBe(secondFile);

    // 뒤늦게 첫 번째 리사이징이 끝나도 결과가 무시되어야 함
    await act(async () => {
      resolveFirst(firstFile);
      await firstSelectPromise;
    });

    expect(result.current.pendingFile).toBe(secondFile);
  });

  it("handleRemoveImage 시 blob URL을 해제하고 상태를 초기화한다", async () => {
    const { result } = renderHook(() => useStoryImageField(undefined));
    const file = new File(["content"], "photo.png", { type: "image/png" });

    await act(async () => {
      await result.current.handleImageSelect(makeChangeEvent(file));
    });
    expect(result.current.previewUrl).toBe("blob:mock-url");

    act(() => {
      result.current.handleRemoveImage();
    });

    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    expect(result.current.previewUrl).toBeUndefined();
    expect(result.current.thumbnailUrl).toBeUndefined();
    expect(result.current.pendingFile).toBeNull();
  });

  it("서버 URL(blob이 아님)은 handleRemoveImage 시 revokeObjectURL을 호출하지 않는다", () => {
    const { result } = renderHook(() => useStoryImageField("https://example.com/thumb.jpg"));

    act(() => {
      result.current.handleRemoveImage();
    });

    expect(global.URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it("resetThumbnail 호출 시 thumbnailUrl과 previewUrl을 새 값으로 갱신한다", () => {
    const { result } = renderHook(() => useStoryImageField(undefined));

    act(() => {
      result.current.resetThumbnail("https://example.com/new.jpg");
    });

    expect(result.current.thumbnailUrl).toBe("https://example.com/new.jpg");
    expect(result.current.previewUrl).toBe("https://example.com/new.jpg");
  });

  it("언마운트 시 남아있는 blob 미리보기 URL을 해제한다", async () => {
    const { result, unmount } = renderHook(() => useStoryImageField(undefined));
    const file = new File(["content"], "photo.png", { type: "image/png" });

    await act(async () => {
      await result.current.handleImageSelect(makeChangeEvent(file));
    });

    unmount();

    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });
});

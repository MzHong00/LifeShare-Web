import { afterEach, describe, expect, it, vi } from "vitest";

import { resizeImageFile } from "./imageResize";

const createFile = (name = "photo.png", type = "image/png") => new File(["dummy"], name, { type });

/** createImageBitmap 목을 지정한 크기로 설정한다 */
const mockBitmap = (width: number, height: number) => {
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width, height, close: vi.fn() }));
};

describe("resizeImageFile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("긴 변이 이미 MAX_DIMENSION 이하면 원본 파일을 그대로 반환한다", async () => {
    const file = createFile();
    mockBitmap(800, 600);

    const result = await resizeImageFile(file);

    expect(result).toBe(file);
  });

  it("긴 변이 MAX_DIMENSION을 초과하면 축소된 JPEG 파일을 반환한다", async () => {
    const file = createFile("big.png");
    mockBitmap(3200, 1600);

    const toBlobMock = vi
      .spyOn(HTMLCanvasElement.prototype, "toBlob")
      .mockImplementation((callback: BlobCallback) => {
        callback(new Blob(["resized"], { type: "image/jpeg" }));
      });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    const result = await resizeImageFile(file);

    expect(toBlobMock).toHaveBeenCalled();
    expect(result.type).toBe("image/jpeg");
    expect(result.name).toBe("big.jpg");
    expect(result).not.toBe(file);
  });

  it("maxDimension을 넘기면 그 값을 기준으로 축소 여부를 판단한다", async () => {
    const file = createFile("avatar.png");
    mockBitmap(800, 600);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback: BlobCallback) => {
      callback(new Blob(["resized"], { type: "image/jpeg" }));
    });

    const result = await resizeImageFile(file, 320);

    expect(result).not.toBe(file);
    expect(result.name).toBe("avatar.jpg");
  });

  it("canvas context를 얻지 못하면 원본 파일을 그대로 반환한다", async () => {
    const file = createFile("big.png");
    mockBitmap(3200, 1600);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    const result = await resizeImageFile(file);

    expect(result).toBe(file);
  });

  it("toBlob이 null을 반환하면 원본 파일을 그대로 반환한다", async () => {
    const file = createFile("big.png");
    mockBitmap(3200, 1600);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback: BlobCallback) => {
      callback(null);
    });

    const result = await resizeImageFile(file);

    expect(result).toBe(file);
  });

  it("이미지 디코딩이 실패하면 원본 파일을 그대로 반환한다", async () => {
    const file = createFile();
    vi.stubGlobal("createImageBitmap", vi.fn().mockRejectedValue(new Error("decode failed")));

    const result = await resizeImageFile(file);

    expect(result).toBe(file);
  });
});

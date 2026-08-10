const MAX_DIMENSION = 1600; // 긴 변 기준 최대 픽셀 수 (스토리 썸네일 등 크게 보여지는 이미지 기준)
const JPEG_QUALITY = 0.82;

/**
 * 이미지 파일을 canvas로 그려 긴 변을 maxDimension 이하로 축소하고 JPEG로 압축한다.
 * 이미 충분히 작은 이미지는 원본을 그대로 반환한다.
 * 디코딩/인코딩 실패 시 원본 파일을 그대로 반환한다(업로드 자체가 막히지 않도록).
 */
export const resizeImageFile = async (
  file: File,
  maxDimension: number = MAX_DIMENSION
): Promise<File> => {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, maxDimension / Math.max(width, height));

    if (scale === 1) {
      bitmap.close();
      return file;
    }

    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    return file;
  }
};

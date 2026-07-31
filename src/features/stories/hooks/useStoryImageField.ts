import { useEffect, useRef, useState } from "react";

import { resizeImageFile } from "@/utils/imageResize";

/** blob 미리보기 URL이면 메모리 누수 방지를 위해 해제한다 */
const revokeIfBlobUrl = (url: string | undefined) => {
  if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
};

/**
 * 스토리 폼의 썸네일 이미지 선택·미리보기·정리를 담당하는 훅.
 * 파일 선택 시 리사이징 후 blob 미리보기 URL을 만들고, 언마운트나 교체 시 이전 blob URL을 해제한다.
 */
export const useStoryImageField = (initialThumbnailUrl: string | undefined) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(initialThumbnailUrl); // 서버에 저장된 썸네일 URL
  const [pendingFile, setPendingFile] = useState<File | null>(null); // 업로드 대기 중인 선택 파일
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(initialThumbnailUrl); // 화면에 표시할 미리보기 URL

  // 언마운트 시점에 최신 previewUrl을 참조하기 위한 ref (blob URL 정리용)
  const previewUrlRef = useRef(previewUrl);
  // 진행 중인 이미지 선택 요청을 식별해 오래된 리사이징 결과를 무시하기 위한 토큰
  const imageSelectRequestIdRef = useRef(0);

  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  /** 컴포넌트 언마운트 시(저장/제거 없이 화면 이탈) 남아있는 blob 미리보기 URL을 해제한다 */
  useEffect(() => {
    return () => revokeIfBlobUrl(previewUrlRef.current);
  }, []);

  /** 기존 스토리 로드 완료 등으로 초기 썸네일이 뒤늦게 확정될 때 폼 값을 채운다 */
  const resetThumbnail = (newThumbnailUrl: string | undefined) => {
    setThumbnailUrl(newThumbnailUrl);
    setPreviewUrl(newThumbnailUrl);
  };

  /** 파일 선택 시 리사이징 후 미리보기 blob URL 생성 (기존 blob은 해제 후 교체) */
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // 동일 파일 재선택 시에도 onChange가 발생하도록 초기화

    const requestId = ++imageSelectRequestIdRef.current;
    const resizedFile = await resizeImageFile(file);

    // 리사이징 도중 다른 이미지가 다시 선택되었다면 이 결과는 폐기한다(최신 선택 덮어쓰기 방지)
    if (requestId !== imageSelectRequestIdRef.current) return;

    revokeIfBlobUrl(previewUrlRef.current);
    const blobUrl = URL.createObjectURL(resizedFile);
    setPendingFile(resizedFile);
    setPreviewUrl(blobUrl);
  };

  /** 선택한 이미지 제거 및 blob URL 정리 */
  const handleRemoveImage = () => {
    revokeIfBlobUrl(previewUrl);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // 동일 파일 재선택 시에도 onChange가 발생하도록 초기화
    }
    setPendingFile(null);
    setPreviewUrl(undefined);
    setThumbnailUrl(undefined);
  };

  return {
    fileInputRef,
    thumbnailUrl,
    pendingFile,
    previewUrl,
    resetThumbnail,
    handleImageSelect,
    handleRemoveImage,
  };
};

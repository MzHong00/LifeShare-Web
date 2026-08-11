import { RefObject } from "react";
import { Image as ImageIcon, X } from "lucide-react";

import { ICON_SIZE } from "@/constants/style";

import styles from "./StoryImagePicker.module.scss";

interface StoryImagePickerProps {
  previewUrl?: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  /** 파일 선택 시 호출 */
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** 선택 이미지 제거 시 호출 */
  onRemove: () => void;
}

/** 스토리 작성 폼의 사진 선택/미리보기/제거 UI */
export const StoryImagePicker = ({
  previewUrl,
  fileInputRef,
  onSelect,
  onRemove,
}: StoryImagePickerProps) => {
  return (
    <div>
      {previewUrl ? (
        <div className={styles.thumbnailWrap}>
          <img src={previewUrl} alt="선택한 스토리 사진" className={styles.thumbnail} />
          <button onClick={onRemove} className={styles.removeButton} aria-label="사진 제거">
            <X size={ICON_SIZE.md} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className={styles.imagePlaceholder}
          aria-label="사진 추가하기"
        >
          <ImageIcon size={ICON_SIZE["2xl"]} />
          <span>사진 추가하기</span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className={styles.fileInput}
        onChange={onSelect}
      />
    </div>
  );
};

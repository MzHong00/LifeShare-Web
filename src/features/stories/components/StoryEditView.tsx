"use client";

import dynamic from "next/dynamic";

import { AppHeader } from "@/components/layout/AppHeader";
import { useStoryForm } from "@/features/stories/hooks/useStoryForm";
import { StoryImagePicker } from "@/features/stories/components/StoryImagePicker";
import { StoryPathField } from "@/features/stories/components/StoryPathField";

import styles from "./StoryEditView.module.scss";

// Google Maps SDK 의존 컴포넌트라 경로 선택 모달을 열 때만 청크를 내려받도록 지연 로딩
const PathPickerMap = dynamic(
  () => import("@/features/map/components/PathPickerMap").then((mod) => mod.PathPickerMap),
  { ssr: false }
);

export const StoryEditView = () => {
  const {
    isEditMode,
    fileInputRef,
    title,
    setTitle,
    description,
    setDescription,
    date,
    setDate,
    previewUrl,
    pathColor,
    path,
    setPath,
    isPathPickerOpen,
    setIsPathPickerOpen,
    isSaving,
    handleImageSelect,
    handleRemoveImage,
    handlePathConfirm,
    handleSave,
  } = useStoryForm();

  let saveButtonLabel = isEditMode ? "수정하기" : "기록하기";
  if (isSaving) saveButtonLabel = "저장 중...";

  return (
    <>
      <div className={styles.page}>
        <AppHeader />

        <div className={styles.scrollArea}>
          <StoryImagePicker
            previewUrl={previewUrl}
            fileInputRef={fileInputRef}
            onSelect={handleImageSelect}
            onRemove={handleRemoveImage}
          />

          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.label}>제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="어떤 기억인가요? (선택)"
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>내용</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="그날의 이야기를 들려주세요 (선택)"
                rows={4}
                className={styles.textarea}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>날짜</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>경로</label>
              <StoryPathField
                path={path}
                pathColor={pathColor}
                onEdit={() => setIsPathPickerOpen(true)}
                onClear={() => setPath([])}
              />
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={handleSave} className={styles.saveButton} disabled={isSaving}>
            {saveButtonLabel}
          </button>
        </div>
      </div>

      {isPathPickerOpen && (
        <PathPickerMap
          initialPath={path}
          initialColor={pathColor}
          onConfirm={handlePathConfirm}
          onClose={() => setIsPathPickerOpen(false)}
        />
      )}
    </>
  );
};

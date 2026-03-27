"use client";
import { useState, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Image as ImageIcon, X, MapPin } from "lucide-react";
import { useStoryStore, storyActions } from "@/stores/useStoryStore";
import { modalActions } from "@/stores/useModalStore";
import { AppHeader } from "@/components/common/AppHeader";
import { PathPickerMap } from "@/components/map/PathPickerMap";
import { PathPreview } from "@/components/map/PathPreview";
import { PATH_COLORS } from "@/constants/theme";
import { getTodayDateString, formatDate } from "@/utils/date";
import type { LocationPoint } from "@/types";
import styles from "./storyEdit.module.scss";

function StoryEditContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storyId = searchParams.get("storyId");
  const isEditMode = !!storyId;

  const stories = useStoryStore((s) => s.stories);
  const existingStory = useMemo(
    () => (isEditMode ? stories.find((s) => s.id === storyId) : null),
    [isEditMode, storyId, stories],
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(existingStory?.title || "");
  const [description, setDescription] = useState(
    existingStory?.description || "",
  );
  const [date, setDate] = useState(
    existingStory
      ? formatDate(existingStory.date, "YYYY-MM-DD")
      : getTodayDateString(),
  );
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(
    existingStory?.thumbnailUrl,
  );
  const [pathColor, setPathColor] = useState<string>(
    existingStory?.pathColor ?? PATH_COLORS[0],
  );
  const [path, setPath] = useState<LocationPoint[]>(existingStory?.path || []);
  const [showPathPicker, setShowPathPicker] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailUrl(URL.createObjectURL(file));
  };

  const handleSave = () => {
    if (!title.trim()) {
      modalActions.showModal({
        type: "alert",
        title: "알림",
        message: "스토리의 제목을 입력해주세요.",
      });
      return;
    }

    const storyData = {
      title: title.trim(),
      description: description.trim(),
      thumbnailUrl,
      path,
      pathColor,
    };

    if (isEditMode && storyId) {
      storyActions.updateStory(storyId, storyData);
    } else {
      storyActions.addStory({
        ...storyData,
        date: new Date(date).toISOString(),
      });
    }

    modalActions.showModal({
      type: "alert",
      title: "성공",
      message: isEditMode
        ? "스토리가 수정되었습니다."
        : "새로운 스토리가 기록되었습니다.",
      onConfirm: () => router.back(),
    });
  };

  return (
    <>
      <div className={styles.page}>
        <AppHeader />

        <div className={styles.scrollArea}>
          {/* 썸네일 */}
          <div>
            {thumbnailUrl ? (
              <div className={styles.thumbnailWrap}>
                <img
                  src={thumbnailUrl}
                  alt="thumbnail"
                  className={styles.thumbnail}
                />
                <button
                  onClick={() => setThumbnailUrl(undefined)}
                  className={styles.removeButton}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className={styles.imagePlaceholder}
              >
                <ImageIcon size={32} />
                <span>사진 추가하기</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={handleImageSelect}
            />
          </div>

          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.label}>
                제목 <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="어떤 스토리인가요?"
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

            {/* 경로 */}
            <div className={styles.field}>
              <label className={styles.label}>경로</label>
              {path.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setShowPathPicker(true)}
                  className={styles.pathPlaceholder}
                >
                  <div className={styles.pathPlaceholderIcon}>
                    <MapPin size={22} />
                  </div>
                  <p className={styles.pathPlaceholderText}>경로 추가하기</p>
                  <p className={styles.pathPlaceholderSub}>
                    지도를 탭해서 이동 경로를 기록하세요
                  </p>
                </button>
              ) : (
                <PathPreview
                  path={path}
                  pathColor={pathColor}
                  onEdit={() => setShowPathPicker(true)}
                  onClear={() => setPath([])}
                />
              )}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={handleSave} className={styles.saveButton}>
            {isEditMode ? "수정하기" : "기록하기"}
          </button>
        </div>
      </div>

      {/* 경로 피커 오버레이 */}
      {showPathPicker && (
        <PathPickerMap
          initialPath={path}
          initialColor={pathColor}
          onConfirm={(newPath, newColor) => {
            setPath(newPath);
            setPathColor(newColor);
            setShowPathPicker(false);
          }}
          onClose={() => setShowPathPicker(false)}
        />
      )}
    </>
  );
}

export default function StoryEditPage() {
  return (
    <Suspense>
      <StoryEditContent />
    </Suspense>
  );
}

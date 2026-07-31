import { MapPin } from "lucide-react";

import { PathPreview } from "@/features/map/components/PathPreview";

import styles from "./StoryPathField.module.scss";

import type { LocationPoint } from "@/features/stories/types/story";

interface StoryPathFieldProps {
  path: LocationPoint[];
  pathColor: string;
  /** 경로 추가/편집 지도를 열 때 호출 */
  onEdit: () => void;
  /** 경로 초기화 시 호출 */
  onClear: () => void;
}

export const StoryPathField = ({ path, pathColor, onEdit, onClear }: StoryPathFieldProps) => {
  if (path.length === 0) {
    return (
      <button type="button" onClick={onEdit} className={styles.pathPlaceholder}>
        <div className={styles.pathPlaceholderIcon}>
          <MapPin size={22} />
        </div>
        <p className={styles.pathPlaceholderText}>경로 추가하기</p>
        <p className={styles.pathPlaceholderSub}>지도를 탭해서 이동 경로를 기록하세요</p>
      </button>
    );
  }

  return <PathPreview path={path} pathColor={pathColor} onEdit={onEdit} onClear={onClear} />;
};

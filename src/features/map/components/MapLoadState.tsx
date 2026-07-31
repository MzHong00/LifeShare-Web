import { Spinner } from "@/components/feedback/Spinner";
import { cx } from "@/utils/cn";

import styles from "./MapLoadState.module.scss";

import type { MapLoadStatus } from "@/features/map/hooks/useGoogleMap";

interface MapLoadStateProps {
  status: Exclude<MapLoadStatus, "ready">;
  errorMessage?: string | null;
}

/** 지도 로드 전 상태(키 부재·에러·로딩)를 표시하는 플레이스홀더 */
export const MapLoadState = ({ status, errorMessage }: MapLoadStateProps) => {
  if (status === "missing-key") {
    return (
      <div className={styles.container}>
        <div className={styles.emoji}>🗺️</div>
        <p className={styles.title}>Google Maps API 키가 없습니다</p>
        <p className={styles.desc}>.env.local에 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY를 설정해주세요</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.container}>
        <p className={cx(styles.title, styles.titleError)}>지도를 불러오지 못했습니다</p>
        {errorMessage && <p className={styles.desc}>{errorMessage}</p>}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Spinner />
    </div>
  );
};

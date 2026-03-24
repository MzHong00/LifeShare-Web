import { MapPin } from "lucide-react";
import styles from "./MapEmptyState.module.scss";

export const MapEmptyState = () => {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrap}>
        <MapPin size={28} />
      </div>
      <div className={styles.text}>
        <p className={styles.title}>마커를 선택해보세요</p>
        <p className={styles.desc}>
          지도에서 멤버나 스토리 경로를 선택하면{"\n"}상세 정보를 볼 수 있어요
        </p>
      </div>
    </div>
  );
};

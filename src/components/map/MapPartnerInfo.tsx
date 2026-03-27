import { Battery, MapPin, Clock, Navigation, ChevronRight } from "lucide-react";
import { ProfileImage } from "@/components/common/ProfileImage";
import type { WorkspaceMember } from "@/types";
import styles from "./MapPartnerInfo.module.scss";

interface RecentPlace {
  id: string;
  name: string;
  date: string;
}

interface MapPartnerInfoProps {
  member: WorkspaceMember;
  onOpenDirections: () => void;
  recentPlaces: RecentPlace[];
}

export const MapPartnerInfo = ({ member, onOpenDirections, recentPlaces }: MapPartnerInfoProps) => {
  return (
    <>
      <div className={styles.statusCard}>
        <div className={styles.memberRow}>
          <div className={styles.memberLeft}>
            <ProfileImage uri={member.avatar} name={member.name} size={44} />
            <span className={styles.memberName}>{member.name}</span>
          </div>
          <div className={styles.batteryRow}>
            <Battery size={16} />
            <span>85%</span>
          </div>
        </div>
        <div className={styles.locationRow}>
          <MapPin size={16} style={{ flexShrink: 0 }} />
          <span className={styles.locationText}>서울특별시 강남구 역삼동</span>
        </div>
        <div className={styles.timeRow}>
          <Clock size={14} />
          <span>10분 전 확인됨</span>
        </div>
      </div>

      <div className={styles.directionsSection}>
        <button onClick={onOpenDirections} className={styles.directionsButton}>
          <Navigation size={18} />
          <span>경로 찾기</span>
        </button>
      </div>

      <div className={styles.placesSection}>
        <p className={styles.placesTitle}>최근 함께한 장소</p>
        <div className={styles.placesList}>
          {recentPlaces.map((place) => (
            <button key={place.id} className={styles.placeButton}>
              <div className={styles.placeIcon}>
                <MapPin size={18} />
              </div>
              <div className={styles.placeInfo}>
                <p className={styles.placeName}>{place.name}</p>
                <p className={styles.placeDate}>{place.date}</p>
              </div>
              <ChevronRight size={16} className={styles.chevron} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

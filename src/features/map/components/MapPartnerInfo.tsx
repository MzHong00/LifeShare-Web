import { MapPin, Navigation, ChevronRight } from "lucide-react";

import { ProfileImage } from "@/components/ui/ProfileImage";

import styles from "./MapPartnerInfo.module.scss";

import type { WorkspaceMember } from "@/features/workspace/types/workspace";
import { ICON_SIZE, AVATAR_SIZE } from "@/constants/style";

interface RecentPlace {
  id: string;
  name: string;
  date: string;
}

interface MapPartnerInfoProps {
  member: WorkspaceMember;
  /** 외부 지도 길찾기 열기 */
  onOpenDirections: () => void;
  recentPlaces: RecentPlace[];
}

export const MapPartnerInfo = ({ member, onOpenDirections, recentPlaces }: MapPartnerInfoProps) => {
  return (
    <>
      <div className={styles.statusCard}>
        <div className={styles.memberRow}>
          <div className={styles.memberLeft}>
            <ProfileImage uri={member.avatar} name={member.name} size={AVATAR_SIZE.lg} />
            <span className={styles.memberName}>{member.name}</span>
          </div>
        </div>
      </div>

      <div className={styles.directionsSection}>
        <button type="button" onClick={onOpenDirections} className={styles.directionsButton}>
          <Navigation size={ICON_SIZE.lg} />
          <span>경로 찾기</span>
        </button>
      </div>

      {recentPlaces.length > 0 && (
        <div className={styles.placesSection}>
          <p className={styles.placesTitle}>최근 함께한 장소</p>
          <div className={styles.placesList}>
            {recentPlaces.map((place) => (
              <button type="button" key={place.id} className={styles.placeButton}>
                <div className={styles.placeIcon}>
                  <MapPin size={ICON_SIZE.lg} />
                </div>
                <div className={styles.placeInfo}>
                  <p className={styles.placeName}>{place.name}</p>
                  <p className={styles.placeDate}>{place.date}</p>
                </div>
                <ChevronRight size={ICON_SIZE.md} className={styles.chevron} />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

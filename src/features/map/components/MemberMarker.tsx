import { memo } from "react";

import { OverlayView } from "@react-google-maps/api";
import Image from "next/image";

import { cx } from "@/utils/cn";
import { getInitials } from "@/utils/format";

import styles from "./MemberMarker.module.scss";

import type { WorkspaceMember } from "@/features/workspace/types/workspace";

interface MemberMarkerProps {
  member: WorkspaceMember;
  lat: number;
  lng: number;
  isMe: boolean;
  onClick: (memberId: string) => void;
}

// recordingPath 갱신 등 지도 전체 리렌더 시에도, 위치·선택 상태가 그대로인 마커는 OverlayView 재생성을 건너뛴다
const MemberMarkerComponent = ({ member, lat, lng, isMe, onClick }: MemberMarkerProps) => {
  return (
    <OverlayView position={{ lat, lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
      <button type="button" onClick={() => onClick(member.id)} className={styles.marker}>
        <div className={cx(styles.avatar, isMe && styles.avatarMe)}>
          {member.avatar ? (
            <Image
              src={member.avatar}
              alt={member.name}
              width={48}
              height={48}
              className={styles.image}
            />
          ) : (
            <span className={styles.initial}>{getInitials(member.name)}</span>
          )}
        </div>
      </button>
    </OverlayView>
  );
};

/** 지도 위 멤버 아바타 마커 (Google Maps OverlayView) */
export const MemberMarker = memo(MemberMarkerComponent);
MemberMarker.displayName = "MemberMarker";

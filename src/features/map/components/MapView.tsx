"use client";
import dynamic from "next/dynamic";
import { Route, Square, Search } from "lucide-react";

import { cx } from "@/utils/cn";
import { useMapView } from "@/features/map/hooks/useMapView";
import { MapEmptyState } from "@/features/map/components/MapEmptyState";
import { MapLoadState } from "@/features/map/components/MapLoadState";
import { MapPartnerInfo } from "@/features/map/components/MapPartnerInfo";
import { MapStoryInfo } from "@/features/map/components/MapStoryInfo";
import { ProfileImage } from "@/components/ui/ProfileImage";
import { BottomDrawer } from "@/components/layout/BottomDrawer";
import { ICON_SIZE, AVATAR_SIZE } from "@/constants/style";

import styles from "./MapView.module.scss";

// Google Maps SDK(@react-google-maps/api)는 지도 페이지에서만 필요한 무거운 서드파티 라이브러리라
// 초기 번들에서 분리하고, 진입 시에만 청크를 내려받도록 지연 로딩한다 (SSR 불가: window/DOM 의존)
const RECENT_PLACES: never[] = []; // 최근 함께한 장소 — 미구현 기능(매 렌더 새 배열 생성을 막기 위해 모듈 상수로 고정)

const GoogleMapView = dynamic(
  () => import("@/features/map/components/GoogleMapView").then((mod) => mod.GoogleMapView),
  { ssr: false, loading: () => <MapLoadState status="loading" /> }
);

export const MapView = () => {
  const {
    currentWorkspace,
    myUserId,
    myLocation,
    isRecording,
    recordingPath,
    toggleRecording,
    stories,
    memberLocations,
    selectedStoryId,
    selectedStory,
    selectedUser,
    focusLocation,
    selectMember,
    selectStory,
    openDirections,
  } = useMapView();

  return (
    <div className={styles.page}>
      <div className={styles.memberHeader}>
        {currentWorkspace?.members?.map((member) => {
          const isSelected = selectedUser?.id === member.id;
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => selectMember(member.id)}
              className={cx(styles.memberButton, isSelected && styles.memberButtonActive)}
            >
              <div className={cx(styles.memberAvatarWrap, isSelected && styles.memberAvatarActive)}>
                <ProfileImage uri={member.avatar} name={member.name} size={AVATAR_SIZE.xl} />
                <span className={styles.focusBadge}>
                  <Search size={ICON_SIZE.sm} strokeWidth={2.5} />
                </span>
              </div>
              <span className={cx(styles.memberName, isSelected && styles.memberNameActive)}>
                {member.name}
              </span>
            </button>
          );
        })}
      </div>

      <GoogleMapView
        center={myLocation}
        focusLocation={focusLocation}
        myUserId={myUserId}
        memberLocations={memberLocations}
        stories={stories}
        recordingPath={recordingPath}
        isRecording={isRecording}
        selectedStoryId={selectedStoryId}
        onMemberClick={selectMember}
        onStoryClick={selectStory}
      />

      <div className={styles.recordFab}>
        <button
          type="button"
          onClick={toggleRecording}
          className={cx(
            styles.recordButton,
            isRecording ? styles.recordButtonActive : styles.recordButtonIdle
          )}
        >
          {isRecording ? (
            <>
              <Square size={ICON_SIZE.md} fill="white" color="white" />
              <span className={styles.recordLabel}>스토리 기록 종료</span>
            </>
          ) : (
            <>
              <Route size={ICON_SIZE.md} />
              <span className={styles.recordLabel}>스토리 기록 시작</span>
            </>
          )}
        </button>
      </div>

      <BottomDrawer>
        {/* 스토리 선택 > 멤버 선택 > 빈 상태 순으로 우선 노출 */}
        {selectedStory && <MapStoryInfo story={selectedStory} />}
        {!selectedStory && selectedUser && (
          <MapPartnerInfo
            member={selectedUser}
            onOpenDirections={openDirections}
            recentPlaces={RECENT_PLACES}
          />
        )}
        {!selectedStory && !selectedUser && <MapEmptyState />}
      </BottomDrawer>
    </div>
  );
};

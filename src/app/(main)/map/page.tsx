"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Route, Square, Search } from "lucide-react";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { useStoryStore, storyActions } from "@/stores/useStoryStore";
import { toastActions } from "@/stores/useToastStore";
import { GoogleMapView } from "@/components/map/GoogleMapView";
import { MapEmptyState } from "@/components/map/MapEmptyState";
import { MapPartnerInfo } from "@/components/map/MapPartnerInfo";
import { MapStoryInfo } from "@/components/map/MapStoryInfo";
import { ProfileImage } from "@/components/common/ProfileImage";
import type { WorkspaceMember } from "@/types";
import { BottomDrawer } from "@/components/common/BottomDrawer";
import styles from "./map.module.scss";

const MY_USER_ID = "user-1";
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
const MOCK_MEMBER_LOCATION_MAP: Record<string, { lat: number; lng: number }> = {
  "user-2": { lat: 37.5, lng: 127.03 },
};
const RECENT_PLACES = [
  { id: "1", name: "명동 성당 카페", date: "어제 오후 2:00" },
  { id: "2", name: "남산 타워", date: "3일 전" },
  { id: "3", name: "강남구청 역 이자카야", date: "지난 주말" },
];

export default function MapPage() {
  const router = useRouter();
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const stories = useStoryStore((s) => s.stories);
  const selectedStoryId = useStoryStore((s) => s.selectedStoryId);
  const isRecording = useStoryStore((s) => s.isRecording);
  const recordingPath = useStoryStore((s) => s.recordingPath);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setMyLocation(DEFAULT_CENTER)
      );
    }
  }, []);

  const memberLocations = (currentWorkspace?.members ?? [])
    .map((member) => {
      if (member.id === MY_USER_ID) {
        const loc = myLocation ?? DEFAULT_CENTER;
        return { member, lat: loc.lat, lng: loc.lng };
      }
      const loc = MOCK_MEMBER_LOCATION_MAP[member.id];
      if (!loc) return null;
      return { member, lat: loc.lat, lng: loc.lng };
    })
    .filter(Boolean) as { member: WorkspaceMember; lat: number; lng: number }[];

  const mapCenter = myLocation ?? DEFAULT_CENTER;
  const selectedStory = stories.find((s) => s.id === selectedStoryId);
  const selectedUser = currentWorkspace?.members?.find((m) => m.id === selectedUserId);

  const toggleRecording = () => {
    if (!isRecording) {
      storyActions.startRecording();
      toastActions.showToast("실시간 위치 기록을 시작합니다.", "info");
    } else {
      if (recordingPath.length < 2) {
        toastActions.showToast("기록된 경로가 너무 짧아 저장할 수 없습니다.", "error");
        storyActions.stopRecording();
        return;
      }
      const newStoryId = `story-${Date.now()}`;
      storyActions.saveStory({
        id: newStoryId,
        title: `${new Date().toLocaleDateString()} 산책`,
        userId: MY_USER_ID,
        workspaceId: currentWorkspace?.id || "ws-1",
        pathColor: "#3182F6",
      });
      toastActions.showToast("새로운 스토리가 기록되었습니다!", "success");
      router.push(`/stories/edit?storyId=${newStoryId}`);
    }
  };

  const openDirections = () => {
    const partner = memberLocations.find((m) => m.member.id !== MY_USER_ID);
    if (!partner) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${partner.lat},${partner.lng}&travelmode=driving`;
    window.open(url, "_blank");
  };

  return (
    <div className={styles.page}>
      <div className={styles.memberHeader}>
        {currentWorkspace?.members?.map((member) => {
          const isSelected = selectedUserId === member.id;
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => {
                const loc = memberLocations.find((m) => m.member.id === member.id);
                if (loc) setFocusLocation({ lat: loc.lat, lng: loc.lng });
                setSelectedUserId(isSelected ? null : member.id);
                storyActions.setSelectedStoryId(null);
              }}
              className={[styles.memberButton, isSelected && styles.memberButtonActive].filter(Boolean).join(' ')}
            >
              <div className={[styles.memberAvatarWrap, isSelected && styles.memberAvatarActive].filter(Boolean).join(' ')}>
                <ProfileImage uri={member.avatar} name={member.name} size={52} />
                <span className={styles.focusBadge}>
                  <Search size={10} strokeWidth={2.5} />
                </span>
              </div>
              <span className={[styles.memberName, isSelected && styles.memberNameActive].filter(Boolean).join(' ')}>
                {member.name}
              </span>
            </button>
          );
        })}
      </div>

      <GoogleMapView
        center={mapCenter}
        focusLocation={focusLocation}
        myUserId={MY_USER_ID}
        memberLocations={memberLocations}
        stories={stories}
        recordingPath={recordingPath}
        isRecording={isRecording}
        selectedStoryId={selectedStoryId}
        onMemberClick={(memberId) => {
          setSelectedUserId((prev) => (prev === memberId ? null : memberId));
          storyActions.setSelectedStoryId(null);
        }}
        onStoryClick={(storyId) => {
          storyActions.setSelectedStoryId(storyId);
          setSelectedUserId(null);
        }}
      />

      <div className={styles.recordFab}>
        <button
          type="button"
          onClick={toggleRecording}
          className={[styles.recordButton, isRecording ? styles.recordButtonActive : styles.recordButtonIdle].filter(Boolean).join(' ')}
        >
          {isRecording ? (
            <>
              <Square size={14} fill="white" color="white" />
              <span className={styles.recordLabel}>스토리 기록 종료</span>
            </>
          ) : (
            <>
              <Route size={14} />
              <span className={styles.recordLabel}>스토리 기록 시작</span>
            </>
          )}
        </button>
      </div>

      <BottomDrawer>
        {selectedStory ? (
          <MapStoryInfo story={selectedStory} />
        ) : selectedUser ? (
          <MapPartnerInfo member={selectedUser} onOpenDirections={openDirections} recentPlaces={RECENT_PLACES} />
        ) : (
          <MapEmptyState />
        )}
      </BottomDrawer>
    </div>
  );
}

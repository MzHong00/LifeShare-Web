"use client";
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { authQueries } from "@/features/auth/queries/authQueries";
import { useStoryStore, storyActions } from "@/features/stories/stores/useStoryStore";
import { storyQueries } from "@/features/stories/queries/storyQueries";
import { useStoryRecording } from "@/features/map/hooks/useStoryRecording";
import { toastActions } from "@/stores/useToastStore";

import type { MemberLocation } from "@/features/map/types/map";

const DIRECTIONS_BASE_URL = "https://www.google.com/maps/dir/?api=1";

/**
 * 지도 화면의 워크스페이스/멤버/스토리 선택 상태와 위치 기록 로직을 캡슐화하는 커스텀 훅.
 * MapView 컴포넌트는 이 훅이 제공하는 상태와 핸들러로 렌더링만 담당한다.
 */
export const useMapView = () => {
  const { currentWorkspace } = useCurrentWorkspace();
  const { data: user } = useQuery(authQueries.user());
  const { data: stories = [] } = useQuery(storyQueries.list(currentWorkspace?.id ?? ""));
  const selectedStoryId = useStoryStore((s) => s.selectedStoryId);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number } | null>(null);

  const myUserId = user?.id ?? "";
  const { myLocation, isRecording, recordingPath, toggleRecording } = useStoryRecording({
    workspaceId: currentWorkspace?.id ?? "",
    userId: myUserId,
  });

  // recordingPath 갱신 등으로 인한 잦은 리렌더에도, 실제 멤버 위치가 바뀌지 않으면 배열 참조를 유지해 마커 리렌더를 방지한다
  const memberLocations = useMemo<MemberLocation[]>(
    () =>
      (currentWorkspace?.members ?? []).flatMap<MemberLocation>((member) => {
        // 실시간 위치 공유(presence) 연동 전까지는 본인 위치만 표시한다
        if (member.id !== myUserId) return [];
        return [{ member, lat: myLocation.lat, lng: myLocation.lng }];
      }),
    [currentWorkspace?.members, myUserId, myLocation.lat, myLocation.lng]
  );

  const selectedStory = stories.find((s) => s.id === selectedStoryId);
  const selectedUser = currentWorkspace?.members?.find((m) => m.id === selectedUserId);

  /** 멤버 마커/헤더 클릭 시 지도 포커스 이동과 선택 상태를 갱신 */
  const selectMember = useCallback(
    (memberId: string) => {
      const loc = memberLocations.find((m) => m.member.id === memberId);
      if (loc) setFocusLocation({ lat: loc.lat, lng: loc.lng });
      setSelectedUserId((prev) => (prev === memberId ? null : memberId));
      storyActions.setSelectedStoryId(null);
    },
    [memberLocations]
  );

  /** 스토리 경로 클릭 시 선택 상태를 갱신 */
  const selectStory = useCallback((storyId: string) => {
    storyActions.setSelectedStoryId(storyId);
    setSelectedUserId(null);
  }, []);

  /** 선택된 상대 위치로 길찾기(구글 지도) 새 탭 열기 */
  const openDirections = useCallback(() => {
    const partner = memberLocations.find((m) => m.member.id !== myUserId);
    if (!partner) {
      toastActions.showToast("상대방의 위치를 아직 확인할 수 없습니다.", "error");
      return;
    }
    const url = `${DIRECTIONS_BASE_URL}&destination=${partner.lat},${partner.lng}&travelmode=driving`;
    window.open(url, "_blank");
  }, [memberLocations, myUserId]);

  return {
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
  };
};

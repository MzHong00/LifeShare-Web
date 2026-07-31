"use client";
import { useEffect, useMemo } from "react";
import { GoogleMap, Polyline } from "@react-google-maps/api";
import { useGoogleMap } from "@/features/map/hooks/useGoogleMap";
import {
  MAP_CONTAINER_STYLE,
  MAP_OPTIONS,
  DEFAULT_ZOOM,
  toLatLngPath,
  getRecordingPolylineOptions,
} from "@/features/map/constants/mapConfig";
import { MapLoadState } from "@/features/map/components/MapLoadState";
import { MemberMarker } from "@/features/map/components/MemberMarker";

import styles from "./GoogleMapView.module.scss";

import type { LocationPoint, Story } from "@/features/stories/types/story";
import type { MemberLocation } from "@/features/map/types/map";

const SELECTED_STROKE_WEIGHT = 6;
const UNSELECTED_STROKE_WEIGHT = 4;
const UNSELECTED_STROKE_OPACITY = 0.25;

interface GoogleMapViewProps {
  center: google.maps.LatLngLiteral;
  focusLocation?: google.maps.LatLngLiteral | null;
  myUserId: string;
  memberLocations: MemberLocation[];
  stories: Story[];
  recordingPath: LocationPoint[];
  isRecording: boolean;
  selectedStoryId: string | null;
  /** 멤버 마커 클릭 */
  onMemberClick: (memberId: string) => void;
  /** 스토리 경로 클릭 */
  onStoryClick: (storyId: string) => void;
}

export function GoogleMapView({
  center,
  focusLocation,
  myUserId,
  memberLocations,
  stories,
  recordingPath,
  isRecording,
  selectedStoryId,
  onMemberClick,
  onStoryClick,
}: GoogleMapViewProps) {
  const { status, loadErrorMessage, mapRef, onMapLoad } = useGoogleMap();

  // 경로가 2개 이상인 스토리만 폴리라인으로 표시 (memberLocations 등 잦은 리렌더에도 재계산 방지)
  const storyPolylines = useMemo(
    () =>
      stories
        .filter((story) => story.path.length > 1)
        .map((story) => ({
          id: story.id,
          path: toLatLngPath(story.path),
          isSelected: story.id === selectedStoryId,
          pathColor: story.pathColor,
        })),
    [stories, selectedStoryId]
  );

  // focusLocation이 바뀌면 지도 중심을 이동
  useEffect(() => {
    if (focusLocation && mapRef.current) {
      mapRef.current.panTo(focusLocation);
    }
  }, [focusLocation, mapRef]);

  if (status !== "ready") {
    return <MapLoadState status={status} errorMessage={loadErrorMessage} />;
  }

  return (
    <div className={styles.wrapper}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={DEFAULT_ZOOM}
        options={MAP_OPTIONS}
        onLoad={onMapLoad}
      >
        {/* 스토리 경로 폴리라인 */}
        {storyPolylines.map(({ id, path, isSelected, pathColor }) => (
          <Polyline
            key={id}
            path={path}
            options={{
              strokeColor: pathColor,
              strokeOpacity: isSelected ? 1 : UNSELECTED_STROKE_OPACITY,
              strokeWeight: isSelected ? SELECTED_STROKE_WEIGHT : UNSELECTED_STROKE_WEIGHT,
              clickable: true,
            }}
            onClick={() => onStoryClick(id)}
          />
        ))}

        {/* 실시간 기록 중인 경로 (점선) */}
        {isRecording && recordingPath.length > 0 && (
          <Polyline path={toLatLngPath(recordingPath)} options={getRecordingPolylineOptions()} />
        )}

        {/* 멤버 아바타 마커 */}
        {memberLocations.map(({ member, lat, lng }) => (
          <MemberMarker
            key={member.id}
            member={member}
            lat={lat}
            lng={lng}
            isMe={member.id === myUserId}
            onClick={onMemberClick}
          />
        ))}
      </GoogleMap>
    </div>
  );
}

"use client";
import { useCallback, useEffect, useRef } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Polyline,
  OverlayView,
} from "@react-google-maps/api";
import { ENV } from "@/constants/config";
import type { LocationPoint, Story, WorkspaceMember } from "@/types";

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  gestureHandling: "greedy",
  styles: [
    { featureType: "transit.line", stylers: [{ visibility: "off" }] },
    { featureType: "transit.station", stylers: [{ visibility: "off" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    {
      featureType: "administrative.land_parcel",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
};

interface MemberLocation {
  member: WorkspaceMember;
  lat: number;
  lng: number;
}

interface Props {
  center: google.maps.LatLngLiteral;
  focusLocation?: google.maps.LatLngLiteral | null;
  myUserId: string;
  memberLocations: MemberLocation[];
  stories: Story[];
  recordingPath: LocationPoint[];
  isRecording: boolean;
  selectedStoryId: string | null;
  onMemberClick: (memberId: string) => void;
  onStoryClick: (storyId: string) => void;
}

const stateContainerStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: "var(--grey-100)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

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
}: Props) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: ENV.GOOGLE_MAPS_API_KEY,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  useEffect(() => {
    if (focusLocation && mapRef.current) {
      mapRef.current.panTo(focusLocation);
    }
  }, [focusLocation]);

  if (!ENV.GOOGLE_MAPS_API_KEY || ENV.GOOGLE_MAPS_API_KEY === "your_google_maps_api_key_here") {
    return (
      <div style={stateContainerStyle}>
        <div style={{ fontSize: 36 }}>🗺️</div>
        <p style={{ color: "var(--grey-500)", fontSize: 14, fontWeight: 500 }}>
          Google Maps API 키가 없습니다
        </p>
        <p style={{ color: "var(--grey-400)", fontSize: 12 }}>
          .env.local에 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY를 설정해주세요
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={stateContainerStyle}>
        <p style={{ color: "var(--error)", fontSize: 14, fontWeight: 500 }}>
          지도를 불러오지 못했습니다
        </p>
        <p style={{ color: "var(--grey-400)", fontSize: 12 }}>{loadError.message}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ ...stateContainerStyle, flexDirection: "row" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "2px solid var(--primary)",
            borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ flex: 1 }}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={14}
        options={MAP_OPTIONS}
        onLoad={onLoad}
      >
        {/* 스토리 경로 폴리라인 */}
        {stories
          .filter((s) => s.path.length > 1)
          .map((story) => {
            const isSelected = story.id === selectedStoryId;
            return (
              <Polyline
                key={story.id}
                path={story.path.map((p) => ({ lat: p.latitude, lng: p.longitude }))}
                options={{
                  strokeColor: story.pathColor,
                  strokeOpacity: isSelected ? 1 : 0.25,
                  strokeWeight: isSelected ? 6 : 4,
                  clickable: true,
                }}
                onClick={() => onStoryClick(story.id)}
              />
            );
          })}

        {/* 실시간 기록 중인 경로 (점선) */}
        {isRecording && recordingPath.length > 0 && (
          <Polyline
            path={recordingPath.map((p) => ({ lat: p.latitude, lng: p.longitude }))}
            options={{
              strokeColor: "#3182F6",
              strokeOpacity: 0,
              strokeWeight: 6,
              icons: [
                {
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillOpacity: 1,
                    fillColor: "#3182F6",
                    strokeOpacity: 0,
                    scale: 3,
                  },
                  offset: "0",
                  repeat: "15px",
                },
              ],
            }}
          />
        )}

        {/* 멤버 아바타 마커 */}
        {memberLocations.map(({ member, lat, lng }) => {
          const isMe = member.id === myUserId;
          return (
            <OverlayView
              key={member.id}
              position={{ lat, lng }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <button
                onClick={() => onMemberClick(member.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  transform: "translate(-50%, -50%)",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  padding: 0,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      border: `2px solid ${isMe ? "var(--primary)" : "white"}`,
                      backgroundColor: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      overflow: "hidden",
                    }}
                  >
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ color: "var(--primary)", fontWeight: 700, fontSize: 16 }}>
                        {member.name[0]}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </OverlayView>
          );
        })}
      </GoogleMap>
    </div>
  );
}

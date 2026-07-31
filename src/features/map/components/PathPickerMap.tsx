"use client";
import { useState, useCallback } from "react";
import { GoogleMap, Polyline, OverlayView } from "@react-google-maps/api";
import { X, RotateCcw, Trash2, Navigation } from "lucide-react";
import { cx } from "@/utils/cn";
import { PATH_COLORS } from "@/constants/theme";
import { useGoogleMap } from "@/features/map/hooks/useGoogleMap";
import {
  MAP_CONTAINER_STYLE,
  MAP_OPTIONS,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  toLatLngPath,
} from "@/features/map/constants/mapConfig";
import { MapLoadState } from "@/features/map/components/MapLoadState";

import styles from "./PathPickerMap.module.scss";

import type { LocationPoint } from "@/features/stories/types/story";

const ENDPOINT_DOT_SIZE = 18;
const WAYPOINT_DOT_SIZE = 12;
const ENDPOINT_BORDER = 3;
const WAYPOINT_BORDER = 2;

interface PathPickerMapProps {
  initialPath?: LocationPoint[];
  initialColor?: string;
  onConfirm: (path: LocationPoint[], color: string) => void;
  onClose: () => void;
}

export function PathPickerMap({
  initialPath = [],
  initialColor,
  onConfirm,
  onClose,
}: PathPickerMapProps) {
  const [path, setPath] = useState<LocationPoint[]>(initialPath);
  const [color, setColor] = useState(initialColor ?? PATH_COLORS[0]);

  const { status, mapRef, onMapLoad } = useGoogleMap();

  /** 지도 로드 시 현재 위치로 이동 */
  const handleLoad = useCallback(
    (map: google.maps.Map) => {
      onMapLoad(map);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => {}
        );
      }
    },
    [onMapLoad]
  );

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    setPath((prev) => [
      ...prev,
      { latitude: e.latLng!.lat(), longitude: e.latLng!.lng(), timestamp: Date.now() },
    ]);
  }, []);

  const handleMyLocation = () => {
    if (!mapRef.current || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) =>
      mapRef.current!.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    );
  };

  return (
    <div className={styles.overlay}>
      {/* 지도 — 전체 */}
      <div className={styles.mapArea}>
        {status !== "ready" ? (
          <MapLoadState status={status} />
        ) : (
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER_STYLE}
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            options={MAP_OPTIONS}
            onLoad={handleLoad}
            onClick={handleMapClick}
          >
            {path.length > 1 && (
              <Polyline
                path={toLatLngPath(path)}
                options={{ strokeColor: color, strokeOpacity: 1, strokeWeight: 5 }}
              />
            )}
            {path.map((point, i) => {
              const isEndpoint = i === 0 || i === path.length - 1;
              const isStart = i === 0;
              const size = isEndpoint ? ENDPOINT_DOT_SIZE : WAYPOINT_DOT_SIZE;
              return (
                <OverlayView
                  key={point.timestamp}
                  position={{ lat: point.latitude, lng: point.longitude }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div style={{ transform: "translate(-50%, -50%)", pointerEvents: "none" }}>
                    {/* 정점 마커 — 색상이 선택값에 따라 동적이라 지도 캔버스 인라인 스타일 유지 */}
                    <div
                      style={{
                        width: size,
                        height: size,
                        borderRadius: "50%",
                        backgroundColor: isStart ? "#ffffff" : color,
                        border: `${isEndpoint ? ENDPOINT_BORDER : WAYPOINT_BORDER}px solid ${isStart ? color : "#ffffff"}`,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                      }}
                    />
                  </div>
                </OverlayView>
              );
            })}
          </GoogleMap>
        )}
      </div>

      {/* X 버튼 — 좌상단 플로팅 */}
      <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="닫기">
        <X size={18} />
      </button>

      {/* 내 위치 FAB */}
      <button
        type="button"
        onClick={handleMyLocation}
        className={styles.locationFab}
        aria-label="내 위치로 이동"
      >
        <Navigation size={17} />
      </button>

      {/* 하단 툴 카드 */}
      <div className={styles.toolCard}>
        {/* 상단: 힌트 or 툴바 */}
        <div className={styles.toolMain}>
          {path.length === 0 ? (
            <p className={styles.hint}>지도를 탭해서 경로를 그려보세요</p>
          ) : (
            <div className={styles.toolbar}>
              <div className={styles.toolLeft}>
                <button
                  type="button"
                  onClick={() => setPath((p) => p.slice(0, -1))}
                  className={styles.toolBtn}
                  aria-label="되돌리기"
                >
                  <RotateCcw size={15} />
                  <span>되돌리기</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPath([])}
                  className={styles.toolBtnDanger}
                  aria-label="초기화"
                >
                  <Trash2 size={15} />
                  <span>초기화</span>
                </button>
              </div>
              <div className={styles.toolRight}>
                <span className={styles.count} style={{ color }}>
                  {path.length}개
                </span>
                <button
                  type="button"
                  onClick={() => onConfirm(path, color)}
                  className={styles.confirmBtn}
                  style={{ backgroundColor: color }}
                >
                  완료
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div className={styles.divider} />

        {/* 색상 선택 row */}
        <div className={styles.colorRow}>
          {PATH_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cx(styles.colorDot, color === c && styles.colorDotActive)}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

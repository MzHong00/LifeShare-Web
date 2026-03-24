"use client";
import { useState, useCallback, useRef } from "react";
import { GoogleMap, useJsApiLoader, Polyline, OverlayView } from "@react-google-maps/api";
import { X, RotateCcw, Trash2, Navigation } from "lucide-react";
import { ENV } from "@/constants/config";
import { PATH_COLORS } from "@/constants/theme";
import type { LocationPoint } from "@/types";
import styles from "./PathPickerMap.module.scss";

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  gestureHandling: "greedy",
  styles: [
    { featureType: "transit.line", stylers: [{ visibility: "off" }] },
    { featureType: "transit.station", stylers: [{ visibility: "off" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
  ],
};

interface Props {
  initialPath?: LocationPoint[];
  initialColor?: string;
  onConfirm: (path: LocationPoint[], color: string) => void;
  onClose: () => void;
}

export function PathPickerMap({ initialPath = [], initialColor, onConfirm, onClose }: Props) {
  const [path, setPath] = useState<LocationPoint[]>(initialPath);
  const [color, setColor] = useState(initialColor ?? PATH_COLORS[0]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: ENV.GOOGLE_MAPS_API_KEY,
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

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
        {!ENV.GOOGLE_MAPS_API_KEY || ENV.GOOGLE_MAPS_API_KEY === "your_google_maps_api_key_here" ? (
          <div className={styles.stateBox}>
            <span className={styles.stateEmoji}>🗺️</span>
            <p className={styles.stateText}>Google Maps API 키가 없습니다</p>
          </div>
        ) : loadError ? (
          <div className={styles.stateBox}>
            <p style={{ color: "var(--error)", fontSize: 14 }}>지도를 불러오지 못했습니다</p>
          </div>
        ) : !isLoaded ? (
          <div className={styles.stateBox}>
            <div className={styles.spinner} />
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER_STYLE}
            center={DEFAULT_CENTER}
            zoom={14}
            options={MAP_OPTIONS}
            onLoad={onLoad}
            onClick={handleMapClick}
          >
            {path.length > 1 && (
              <Polyline
                path={path.map((p) => ({ lat: p.latitude, lng: p.longitude }))}
                options={{ strokeColor: color, strokeOpacity: 1, strokeWeight: 5 }}
              />
            )}
            {path.map((point, i) => {
              const isEndpoint = i === 0 || i === path.length - 1;
              return (
                <OverlayView
                  key={point.timestamp}
                  position={{ lat: point.latitude, lng: point.longitude }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div style={{ transform: "translate(-50%, -50%)", pointerEvents: "none" }}>
                    <div
                      style={{
                        width: isEndpoint ? 18 : 12,
                        height: isEndpoint ? 18 : 12,
                        borderRadius: "50%",
                        backgroundColor: i === 0 ? "#ffffff" : color,
                        border: `${isEndpoint ? 3 : 2}px solid ${i === 0 ? color : "white"}`,
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
      <button type="button" onClick={handleMyLocation} className={styles.locationFab}>
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
              className={[styles.colorDot, color === c && styles.colorDotActive].filter(Boolean).join(' ')}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

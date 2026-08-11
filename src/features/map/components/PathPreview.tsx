import { useMemo } from "react";
import { MapPin, Pencil, Trash2 } from "lucide-react";

import { normalize, fmtCoord, getWaypointLabel } from "@/features/map/utils/pathPreviewUtils";
import { ICON_SIZE } from "@/constants/style";

import styles from "./PathPreview.module.scss";

import type { CSSProperties } from "react";
import type { LocationPoint } from "@/features/stories/types/story";

interface PathPreviewProps {
  path: LocationPoint[];
  pathColor: string;
  onEdit: () => void;
  onClear: () => void;
}

const PAD = 14;
const VIEW_W = 200;
const VIEW_H = 80;
// 경로 선 — 굵은 반투명 글로우 위에 실선을 겹쳐 그린다
const POLYLINE_LAYERS = [
  { strokeWidth: 4, opacity: 0.15 },
  { strokeWidth: 2.5, opacity: 1 },
];
const GRID_SIZE = 20;
const GRID_STROKE_WIDTH = 0.5;
const WAYPOINT_DOT_RADIUS = 2.5;
const WAYPOINT_DOT_OPACITY = 0.7;
const ENDPOINT_OUTER_RADIUS = 6;
const ENDPOINT_INNER_RADIUS = 4.5;
const START_CENTER_RADIUS = 2;
const TRACK_DOT_SIZE_ENDPOINT = 10;
const TRACK_DOT_SIZE_WAYPOINT = 7;

export const PathPreview = ({ path, pathColor, onEdit, onClear }: PathPreviewProps) => {
  const points = useMemo(() => {
    if (path.length === 0) return [];
    const lats = path.map((p) => p.latitude);
    const lngs = path.map((p) => p.longitude);
    const minLat = Math.min(...lats),
      maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs),
      maxLng = Math.max(...lngs);
    const innerW = VIEW_W - PAD * 2;
    const innerH = VIEW_H - PAD * 2;
    return path.map((p) => ({
      x: PAD + normalize(p.longitude, minLng, maxLng, innerW),
      y: PAD + (innerH - normalize(p.latitude, minLat, maxLat, innerH)),
    }));
  }, [path]);

  const polylineStr = useMemo(() => points.map((p) => `${p.x},${p.y}`).join(" "), [points]);

  const startPoint = points[0]; // 시작 정점(있을 때만 강조 마커 표시)
  const endPoint = points.length > 1 ? points[points.length - 1] : undefined; // 도착 정점(정점이 2개 이상일 때만)

  return (
    <div className={styles.card}>
      {/* ── SVG 경로 시각화 ── */}
      <div className={styles.svgArea}>
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className={styles.svg}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
              <path
                d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
                fill="none"
                stroke="var(--grey-200)"
                strokeWidth={GRID_STROKE_WIDTH}
              />
            </pattern>
          </defs>
          <rect width={VIEW_W} height={VIEW_H} fill="url(#grid)" />

          {points.length > 1 &&
            POLYLINE_LAYERS.map(({ strokeWidth, opacity }) => (
              <polyline
                key={strokeWidth}
                points={polylineStr}
                fill="none"
                stroke={pathColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={opacity}
              />
            ))}

          {points.slice(1, -1).map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={WAYPOINT_DOT_RADIUS}
              fill={pathColor}
              opacity={WAYPOINT_DOT_OPACITY}
            />
          ))}

          {startPoint && (
            <>
              <circle cx={startPoint.x} cy={startPoint.y} r={ENDPOINT_OUTER_RADIUS} fill="white" />
              <circle
                cx={startPoint.x}
                cy={startPoint.y}
                r={ENDPOINT_INNER_RADIUS}
                fill={pathColor}
              />
              <circle cx={startPoint.x} cy={startPoint.y} r={START_CENTER_RADIUS} fill="white" />
            </>
          )}

          {endPoint && (
            <>
              <circle cx={endPoint.x} cy={endPoint.y} r={ENDPOINT_OUTER_RADIUS} fill="white" />
              <circle cx={endPoint.x} cy={endPoint.y} r={ENDPOINT_INNER_RADIUS} fill={pathColor} />
            </>
          )}
        </svg>
      </div>

      {/* ── 정보 + 액션 ── */}
      <div className={styles.info}>
        <div className={styles.infoLeft}>
          <div className={styles.dot} style={{ "--path-color": pathColor } as CSSProperties} />
          <div>
            <p className={styles.infoTitle}>경로 저장됨</p>
            <p className={styles.infoSub}>
              <MapPin size={ICON_SIZE.sm} />
              정점 {path.length}개{path.length >= 2 ? " · 경로 완성" : " · 정점을 더 추가하세요"}
            </p>
          </div>
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={onEdit} className={styles.editBtn} aria-label="경로 수정">
            <Pencil size={ICON_SIZE.md} />
          </button>
          <button
            type="button"
            onClick={onClear}
            className={styles.clearBtn}
            aria-label="경로 삭제"
          >
            <Trash2 size={ICON_SIZE.md} />
          </button>
        </div>
      </div>

      {/* ── 정점 좌표 리스트 ── */}
      <div className={styles.divider} />
      <div className={styles.waypointList}>
        {path.map((point, i) => {
          const isFirst = i === 0;
          const isLast = i === path.length - 1;
          const isEndpoint = isFirst || isLast; // 시작/도착 정점 여부 (강조 스타일 적용 기준)
          const label = getWaypointLabel(i, path.length);
          return (
            <div key={point.timestamp} className={styles.waypointRow}>
              {/* 타임라인 트랙 */}
              <div className={styles.track}>
                <div
                  className={styles.trackDot}
                  style={
                    {
                      "--dot-bg": isEndpoint ? pathColor : "var(--grey-300)",
                      "--dot-size": `${isEndpoint ? TRACK_DOT_SIZE_ENDPOINT : TRACK_DOT_SIZE_WAYPOINT}px`,
                      "--dot-outline": isEndpoint ? `2px solid ${pathColor}` : "none",
                    } as CSSProperties
                  }
                />
                {!isLast && (
                  <div
                    className={styles.trackLine}
                    style={
                      { "--line-bg": i === 0 ? pathColor : "var(--grey-200)" } as CSSProperties
                    }
                  />
                )}
              </div>

              {/* 내용 */}
              <div className={styles.waypointContent}>
                <span
                  className={styles.waypointLabel}
                  style={
                    {
                      "--label-color": isEndpoint ? pathColor : "var(--grey-700)",
                    } as CSSProperties
                  }
                >
                  {label}
                </span>
                {/* 좌표 — 나중에 역지오코딩 결과(placeName)로 교체 예정 */}
                <span className={styles.waypointCoord}>
                  {fmtCoord(point.latitude)}, {fmtCoord(point.longitude)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

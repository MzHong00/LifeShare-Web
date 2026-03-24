import { useMemo } from "react";
import { MapPin, Pencil, Trash2 } from "lucide-react";
import type { LocationPoint } from "@/types";
import styles from "./PathPreview.module.scss";

interface Props {
  path: LocationPoint[];
  pathColor: string;
  onEdit: () => void;
  onClear: () => void;
}

const PAD = 14;
const VIEW_W = 200;
const VIEW_H = 80;

function normalize(val: number, min: number, max: number, size: number) {
  if (max === min) return size / 2;
  return ((val - min) / (max - min)) * size;
}

function fmtCoord(n: number) {
  return n.toFixed(5);
}

function getWaypointLabel(index: number, total: number) {
  if (index === 0) return "시작";
  if (index === total - 1) return "도착";
  return `경유 ${index}`;
}

export function PathPreview({ path, pathColor, onEdit, onClear }: Props) {
  const points = useMemo(() => {
    if (path.length === 0) return [];
    const lats = path.map((p) => p.latitude);
    const lngs = path.map((p) => p.longitude);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const innerW = VIEW_W - PAD * 2;
    const innerH = VIEW_H - PAD * 2;
    return path.map((p) => ({
      x: PAD + normalize(p.longitude, minLng, maxLng, innerW),
      y: PAD + (innerH - normalize(p.latitude, minLat, maxLat, innerH)),
    }));
  }, [path]);

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(" ");

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
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--grey-200)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={VIEW_W} height={VIEW_H} fill="url(#grid)" />

          {points.length > 1 && (
            <>
              <polyline
                points={polylineStr}
                fill="none"
                stroke={pathColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.15"
              />
              <polyline
                points={polylineStr}
                fill="none"
                stroke={pathColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {points.slice(1, -1).map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r={2.5} fill={pathColor} opacity={0.7} />
          ))}

          {points.length >= 1 && (
            <>
              <circle cx={points[0].x} cy={points[0].y} r={6} fill="white" />
              <circle cx={points[0].x} cy={points[0].y} r={4.5} fill={pathColor} />
              <circle cx={points[0].x} cy={points[0].y} r={2} fill="white" />
            </>
          )}

          {points.length >= 2 && (
            <>
              <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={6} fill="white" />
              <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={4.5} fill={pathColor} />
            </>
          )}
        </svg>
      </div>

      {/* ── 정보 + 액션 ── */}
      <div className={styles.info}>
        <div className={styles.infoLeft}>
          <div className={styles.dot} style={{ backgroundColor: pathColor }} />
          <div>
            <p className={styles.infoTitle}>경로 저장됨</p>
            <p className={styles.infoSub}>
              <MapPin size={11} />
              정점 {path.length}개{path.length >= 2 ? " · 경로 완성" : " · 정점을 더 추가하세요"}
            </p>
          </div>
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={onEdit} className={styles.editBtn} aria-label="경로 수정">
            <Pencil size={14} />
          </button>
          <button type="button" onClick={onClear} className={styles.clearBtn} aria-label="경로 삭제">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* ── 정점 좌표 리스트 ── */}
      <div className={styles.divider} />
      <div className={styles.waypointList}>
        {path.map((point, i) => {
          const isFirst = i === 0;
          const isLast = i === path.length - 1;
          const label = getWaypointLabel(i, path.length);
          return (
            <div key={point.timestamp} className={styles.waypointRow}>
              {/* 타임라인 트랙 */}
              <div className={styles.track}>
                <div
                  className={styles.trackDot}
                  style={{
                    backgroundColor: isFirst || isLast ? pathColor : "var(--grey-300)",
                    width: isFirst || isLast ? 10 : 7,
                    height: isFirst || isLast ? 10 : 7,
                    outline: isFirst || isLast ? `2px solid ${pathColor}` : "none",
                    outlineOffset: 2,
                  }}
                />
                {!isLast && (
                  <div
                    className={styles.trackLine}
                    style={{ backgroundColor: i === 0 ? pathColor : "var(--grey-200)" }}
                  />
                )}
              </div>

              {/* 내용 */}
              <div className={styles.waypointContent}>
                <span
                  className={styles.waypointLabel}
                  style={{ color: isFirst || isLast ? pathColor : "var(--grey-700)" }}
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
}

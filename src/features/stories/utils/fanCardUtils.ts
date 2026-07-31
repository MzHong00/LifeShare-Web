import type { CSSProperties } from "react";

const FAN_ROTATE_STEP_DEG = 16; // 활성 카드에서 한 장 멀어질 때마다 더해지는 회전(deg)
const FAN_OFFSET_X_STEP = 70; // 활성 카드에서 한 장 멀어질 때마다 더해지는 가로 이동(px)
const FAN_OFFSET_Y_STEP = 15; // 활성 카드에서 한 장 멀어질 때마다 더해지는 세로 이동(px)
const FAN_SCALE_STEP = 0.08; // 활성 카드에서 한 장 멀어질 때마다 줄어드는 배율
const FAN_MIN_SCALE = 0.75; // 부채꼴 카드 최소 배율
const FAN_VISIBLE_RANGE = 2; // 활성 카드 기준 이 장수를 넘게 떨어진 카드는 숨김
const FAN_BEHIND_OPACITY = 0.6; // 활성 카드보다 왼쪽(지나간) 카드의 투명도
const FAN_BASE_Z_INDEX = 10; // 활성 카드의 z-index(멀어질수록 낮아짐)
const FOCUSED_Z_INDEX = 50; // 중앙으로 이동한 카드의 z-index

interface FanCardFocus {
  dx: number; // 카드 중심을 보드 중심으로 옮기기 위한 가로 이동량(px)
  dy: number; // 카드 중심을 보드 중심으로 옮기기 위한 세로 이동량(px)
}

/** index번째 카드가 활성 카드(currentIndex)로부터 원형 배열 기준 몇 장 떨어져 있는지 최단 거리로 계산 */
export const getFanCardDiff = (index: number, currentIndex: number, totalLength: number) => {
  let diff = index - currentIndex;
  const half = Math.floor(totalLength / 2);
  if (diff > half) diff -= totalLength;
  else if (diff < -half) diff += totalLength;
  return diff;
};

/** 부채꼴 카드 한 장의 위치(diff)와 중앙 포커스 여부로 transform·z-index·opacity 스타일을 계산 */
export const getFanCardStyle = (
  diff: number,
  isFocused: boolean,
  focus: FanCardFocus | null
): CSSProperties => {
  const rotate = diff * FAN_ROTATE_STEP_DEG;
  const translateX = diff * FAN_OFFSET_X_STEP;
  const translateY = Math.abs(diff) * FAN_OFFSET_Y_STEP;
  const zIndex = FAN_BASE_Z_INDEX - Math.abs(diff);
  const scale = Math.max(FAN_MIN_SCALE, 1 - Math.abs(diff) * FAN_SCALE_STEP);
  const isHidden = Math.abs(diff) > FAN_VISIBLE_RANGE;
  const opacity = isHidden ? 0 : diff < 0 ? FAN_BEHIND_OPACITY : 1;
  const pointerEvents: CSSProperties["pointerEvents"] = opacity === 0 ? "none" : "auto";

  // 중앙으로 이동한 카드는 부채꼴 위치에 이동량(dx·dy)을 더해 형태·크기 그대로 보드 정중앙으로 보냄
  const offsetX = translateX + (isFocused ? (focus?.dx ?? 0) : 0);
  const offsetY = translateY + (isFocused ? (focus?.dy ?? 0) : 0);

  return {
    transform: `translate3d(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px), 0) rotate(${rotate}deg) scale(${scale})`,
    zIndex: isFocused ? FOCUSED_Z_INDEX : zIndex,
    opacity: isFocused ? 1 : opacity,
    pointerEvents,
  };
};

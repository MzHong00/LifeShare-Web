/** 좌표값을 SVG 뷰포트 크기(size) 안의 위치로 정규화한다 */
export const normalize = (val: number, min: number, max: number, size: number) => {
  if (max === min) return size / 2;
  return ((val - min) / (max - min)) * size;
};

/** 좌표를 소수점 5자리 문자열로 표기한다 */
export const fmtCoord = (n: number) => n.toFixed(5);

/** 정점 순서에 따라 시작/도착/경유 라벨을 반환한다 */
export const getWaypointLabel = (index: number, total: number) => {
  if (index === 0) return "시작";
  if (index === total - 1) return "도착";
  return `경유 ${index}`;
};

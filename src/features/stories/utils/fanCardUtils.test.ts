import { describe, expect, it } from "vitest";

import { getFanCardDiff, getFanCardStyle } from "./fanCardUtils";

describe("getFanCardDiff", () => {
  it("활성 카드 기준 짧은 거리를 그대로 반환한다", () => {
    expect(getFanCardDiff(2, 0, 10)).toBe(2);
    expect(getFanCardDiff(0, 2, 10)).toBe(-2);
  });

  it("원형 배열에서 뒤로 도는 편이 더 가까우면 음수로 감아 반환한다", () => {
    // totalLength=10, half=5 → diff(9)=9-0=9 > half(5) → 9-10=-1
    expect(getFanCardDiff(9, 0, 10)).toBe(-1);
  });

  it("원형 배열에서 앞으로 도는 편이 더 가까우면 양수로 감아 반환한다", () => {
    // index=0, currentIndex=9 → diff=-9 < -half(5) → -9+10=1
    expect(getFanCardDiff(0, 9, 10)).toBe(1);
  });

  it("활성 카드 자신은 0을 반환한다", () => {
    expect(getFanCardDiff(3, 3, 10)).toBe(0);
  });
});

describe("getFanCardStyle", () => {
  it("diff가 0이면 회전·이동 없이 정중앙에 배치되고 완전히 보인다", () => {
    const style = getFanCardStyle(0, false, null);
    expect(style.transform).toContain("rotate(0deg)");
    expect(style.transform).toContain("scale(1)");
    expect(style.opacity).toBe(1);
    expect(style.pointerEvents).toBe("auto");
  });

  it("diff가 가시 범위(FAN_VISIBLE_RANGE=2)를 넘으면 투명해지고 클릭이 막힌다", () => {
    const style = getFanCardStyle(3, false, null);
    expect(style.opacity).toBe(0);
    expect(style.pointerEvents).toBe("none");
  });

  it("diff가 음수(지나간 카드)면 낮은 불투명도로 표시된다", () => {
    const style = getFanCardStyle(-1, false, null);
    expect(style.opacity).toBe(0.6);
    expect(style.pointerEvents).toBe("auto");
  });

  it("diff가 양수(아직 오지 않은 카드)면 완전히 불투명하게 표시된다", () => {
    const style = getFanCardStyle(1, false, null);
    expect(style.opacity).toBe(1);
  });

  it("멀어질수록 z-index가 낮아지고 최소 배율 이하로 줄지 않는다", () => {
    const near = getFanCardStyle(1, false, null);
    const far = getFanCardStyle(2, false, null);
    expect(Number(far.zIndex)).toBeLessThan(Number(near.zIndex));
    expect(far.transform).toContain("scale(0.84)");

    const veryFar = getFanCardStyle(10, false, null);
    expect(veryFar.transform).toContain("scale(0.75)"); // FAN_MIN_SCALE
  });

  it("중앙 포커스 상태면 focus의 dx·dy만큼 추가로 이동하고 최상단 z-index·완전 불투명으로 표시된다", () => {
    const style = getFanCardStyle(1, true, { dx: 40, dy: -20 });
    expect(style.zIndex).toBe(50);
    expect(style.opacity).toBe(1);
    // translateX(1장 * 70) + dx(40) = 110
    expect(style.transform).toContain("calc(-50% + 110px)");
    // translateY(|1| * 15) + dy(-20) = -5
    expect(style.transform).toContain("calc(-50% + -5px)");
  });

  it("포커스 상태인데 focus가 null이면 기본 위치(diff 기준)로만 이동한다", () => {
    const style = getFanCardStyle(1, true, null);
    expect(style.transform).toContain("calc(-50% + 70px)");
  });
});

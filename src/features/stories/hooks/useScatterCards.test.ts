import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useScatterCards } from "./useScatterCards";

import type { RefObject } from "react";

const makeElement = (rect: { width: number; height: number; top?: number; left?: number }) => {
  const el = document.createElement("div");
  Object.defineProperty(el, "offsetWidth", { value: rect.width, configurable: true });
  Object.defineProperty(el, "offsetHeight", { value: rect.height, configurable: true });
  el.getBoundingClientRect = vi.fn(
    () =>
      ({
        top: rect.top ?? 0,
        left: rect.left ?? 0,
        right: (rect.left ?? 0) + rect.width,
        bottom: (rect.top ?? 0) + rect.height,
        width: rect.width,
        height: rect.height,
      }) as DOMRect
  );
  return el;
};

const makePointerEvent = (x: number, y: number, pointerId = 1) =>
  ({
    clientX: x,
    clientY: y,
    pointerId,
  }) as React.PointerEvent<HTMLElement>;

const setup = () => {
  const offsetParent = makeElement({ width: 400, height: 300 });
  const wall = makeElement({ width: 400, height: 300 });
  const offsetParentRef = { current: offsetParent } as RefObject<HTMLElement | null>;
  const wallRef = { current: wall } as RefObject<HTMLElement | null>;

  const { result } = renderHook(() => useScatterCards(offsetParentRef, wallRef, 1, true));

  const cardEl = makeElement({ width: 40, height: 40 });
  cardEl.setPointerCapture = vi.fn();
  cardEl.releasePointerCapture = vi.fn();
  act(() => {
    result.current.setCardRef(0)(cardEl);
    // 카드 ref는 렌더 이후 설정되므로, resize 이벤트로 layout()을 재실행시켜 physics를 초기화한다
    window.dispatchEvent(new Event("resize"));
  });

  return { result, cardEl };
};

/** 카드 여러 장을 등록한 훅 환경을 만든다(부모/벽 ref 교체 및 rAF 프레임 수동 실행 가능) */
const setupCards = (cardCount = 1) => {
  const offsetParent = makeElement({ width: 400, height: 300 });
  const wall = makeElement({ width: 400, height: 300 });
  const offsetParentRef = { current: offsetParent } as RefObject<HTMLElement | null>;
  const wallRef = { current: wall } as RefObject<HTMLElement | null>;

  const { result, unmount } = renderHook(() =>
    useScatterCards(offsetParentRef, wallRef, cardCount, true)
  );

  const cardEls = Array.from({ length: cardCount }, () => {
    const el = makeElement({ width: 40, height: 40 });
    el.setPointerCapture = vi.fn();
    el.releasePointerCapture = vi.fn();
    return el;
  });

  act(() => {
    cardEls.forEach((el, index) => result.current.setCardRef(index)(el));
    window.dispatchEvent(new Event("resize"));
  });

  return { result, cardEls, offsetParentRef, wallRef, unmount };
};

/** transform 문자열에서 translate3d의 x·y(px)를 뽑아낸다 */
const getPos = (el: HTMLElement) => {
  const matched = el.style.transform.match(/translate3d\((-?[\d.]+)px, (-?[\d.]+)px/);
  return { x: Number(matched?.[1]), y: Number(matched?.[2]) };
};

describe("useScatterCards", () => {
  let frames: FrameRequestCallback[] = [];
  let rafSpy: ReturnType<typeof vi.fn>;
  let cancelSpy: ReturnType<typeof vi.fn>;

  /** 예약된 rAF 콜백을 한 프레임만큼 실행한다 */
  const runFrame = () => {
    const pending = frames;
    frames = [];
    act(() => pending.forEach((cb) => cb(0)));
  };

  beforeEach(() => {
    frames = [];
    rafSpy = vi.fn((cb: FrameRequestCallback) => frames.push(cb));
    cancelSpy = vi.fn();
    vi.stubGlobal("requestAnimationFrame", rafSpy);
    vi.stubGlobal("cancelAnimationFrame", cancelSpy);
    vi.spyOn(performance, "now").mockReturnValue(1000); // dt를 1ms로 고정해 속도 계산을 결정적으로 만든다
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("pointerDown 시 pointer capture를 설정한다", () => {
    const { result, cardEl } = setup();

    act(() => {
      result.current.handlePointerDown(0)(makePointerEvent(10, 10));
    });

    expect(cardEl.setPointerCapture).toHaveBeenCalledWith(1);
  });

  it("드래그 없이 pointerUp만 발생하면 클릭을 막지 않는다(release만 호출)", () => {
    const { result, cardEl } = setup();

    act(() => {
      result.current.handlePointerDown(0)(makePointerEvent(10, 10));
      result.current.handlePointerUp(0)(makePointerEvent(10, 10));
    });

    expect(cardEl.releasePointerCapture).toHaveBeenCalledWith(1);
  });

  it("임계값 이상 드래그 후 놓으면 뒤이은 클릭 1회를 차단한다", () => {
    const { result, cardEl } = setup();
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();

    act(() => {
      result.current.handlePointerDown(0)(makePointerEvent(0, 0));
      result.current.handlePointerMove(0)(makePointerEvent(50, 0));
      result.current.handlePointerUp(0)(makePointerEvent(50, 0));
    });

    const clickEvent = new MouseEvent("click", { bubbles: true });
    Object.defineProperty(clickEvent, "preventDefault", { value: preventDefault });
    Object.defineProperty(clickEvent, "stopPropagation", { value: stopPropagation });
    cardEl.dispatchEvent(clickEvent);

    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
  });

  it("bringToCenter 호출 시 카드를 보드 중앙 좌표로 이동시키고 zIndex를 올린다", () => {
    const { result, cardEl } = setup();

    act(() => {
      result.current.bringToCenter(0);
    });

    expect(cardEl.style.zIndex).toBe("50");
    expect(cardEl.style.transform).toContain("translate3d(180px, 130px, 0)");
  });

  it("resetFocus 호출 시 포커스를 해제하고 zIndex를 초기화한다", () => {
    const { result, cardEl } = setup();

    act(() => {
      result.current.bringToCenter(0);
      result.current.resetFocus();
    });

    expect(cardEl.style.zIndex).toBe("");
  });

  it("던진 뒤 프레임이 진행되면 관성으로 이동하고 속도가 마찰로 줄어든다", () => {
    const { result, cardEls } = setupCards();
    const [cardEl] = cardEls;

    act(() => {
      result.current.handlePointerDown(0)(makePointerEvent(0, 0));
      result.current.handlePointerMove(0)(makePointerEvent(1, 0)); // vx = 1/1 * 16 = 16px/frame
      result.current.handlePointerUp(0)(makePointerEvent(1, 0));
    });

    const start = getPos(cardEl);
    runFrame();
    const first = getPos(cardEl);
    runFrame();
    const second = getPos(cardEl);

    expect(first.x - start.x).toBeCloseTo(16);
    expect(second.x - first.x).toBeCloseTo(16 * 0.94); // 마찰로 이동량 감소
    expect(first.y).toBe(start.y);
  });

  it("오른쪽·아래 벽에 닿으면 경계에서 멈춘 뒤 반대 방향으로 튕긴다", () => {
    const { result, cardEls } = setupCards();
    const [cardEl] = cardEls;

    act(() => {
      result.current.handlePointerDown(0)(makePointerEvent(0, 0));
      result.current.handlePointerMove(0)(makePointerEvent(50, 50));
      result.current.handlePointerUp(0)(makePointerEvent(50, 50));
    });

    runFrame();
    const hit = getPos(cardEl);
    runFrame();
    const bounced = getPos(cardEl);

    expect(hit).toEqual({ x: 360, y: 260 }); // 400-40, 300-40
    expect(bounced.x).toBeLessThan(hit.x);
    expect(bounced.y).toBeLessThan(hit.y);
  });

  it("왼쪽·위 벽에 닿으면 경계에서 멈춘 뒤 반대 방향으로 튕긴다", () => {
    const { result, cardEls } = setupCards();
    const [cardEl] = cardEls;

    act(() => {
      result.current.handlePointerDown(0)(makePointerEvent(0, 0));
      result.current.handlePointerMove(0)(makePointerEvent(-50, -50));
      result.current.handlePointerUp(0)(makePointerEvent(-50, -50));
    });

    runFrame();
    const hit = getPos(cardEl);
    runFrame();
    const bounced = getPos(cardEl);

    expect(hit).toEqual({ x: 0, y: 0 });
    expect(bounced.x).toBeGreaterThan(0);
    expect(bounced.y).toBeGreaterThan(0);
  });

  it("속도가 없는 상태로 놓으면 한 프레임 뒤 물리 루프가 종료된다", () => {
    const { result, cardEls } = setupCards();
    const [cardEl] = cardEls;

    act(() => {
      result.current.handlePointerDown(0)(makePointerEvent(0, 0));
      result.current.handlePointerUp(0)(makePointerEvent(0, 0));
    });
    const before = getPos(cardEl);
    runFrame();

    expect(getPos(cardEl)).toEqual(before);
    expect(rafSpy).toHaveBeenCalledTimes(1); // 다음 프레임을 예약하지 않는다
  });

  it("물리 루프가 도는 동안 다른 카드를 던져도 루프를 중복 시작하지 않는다", () => {
    const { result } = setupCards(2);

    act(() => {
      result.current.handlePointerDown(0)(makePointerEvent(0, 0));
      result.current.handlePointerMove(0)(makePointerEvent(1, 0));
      result.current.handlePointerUp(0)(makePointerEvent(1, 0));
      result.current.handlePointerUp(0)(makePointerEvent(1, 0)); // 드래그 중이 아니므로 무시된다
      result.current.handlePointerDown(1)(makePointerEvent(0, 0));
      result.current.handlePointerMove(1)(makePointerEvent(1, 0));
      result.current.handlePointerUp(1)(makePointerEvent(1, 0));
    });

    expect(rafSpy).toHaveBeenCalledTimes(1);
  });

  it("경계를 계산할 수 없으면 드래그 이동을 반영하지 않는다", () => {
    const { result, cardEls, wallRef } = setupCards();
    const before = getPos(cardEls[0]);

    wallRef.current = null;
    act(() => {
      result.current.handlePointerDown(0)(makePointerEvent(0, 0));
      result.current.handlePointerMove(0)(makePointerEvent(50, 50));
    });

    expect(getPos(cardEls[0])).toEqual(before);
  });

  it("중앙 카드의 DOM이 사라진 뒤 resetFocus 해도 오류 없이 포커스를 해제한다", () => {
    const { result, cardEls } = setupCards();

    act(() => {
      result.current.bringToCenter(0);
      result.current.setCardRef(0)(null);
      result.current.resetFocus();
      result.current.setCardRef(0)(cardEls[0]);
      result.current.bringToCenter(0); // 포커스가 해제됐으므로 다시 중앙으로 이동 가능
    });

    expect(getPos(cardEls[0])).toEqual({ x: 180, y: 130 });
  });

  it("드래그 중인 카드는 관성 계산에서 제외된다", () => {
    const { result, cardEls } = setupCards(2);

    act(() => {
      result.current.handlePointerDown(0)(makePointerEvent(0, 0));
      result.current.handlePointerMove(0)(makePointerEvent(1, 0));
      result.current.handlePointerUp(0)(makePointerEvent(1, 0));
      result.current.handlePointerDown(1)(makePointerEvent(0, 0)); // 루프가 도는 동안 다른 카드를 잡는다
    });

    const dragging = getPos(cardEls[1]);
    runFrame();

    expect(getPos(cardEls[1])).toEqual(dragging);
    expect(getPos(cardEls[0]).x).toBeGreaterThan(0);
  });

  it("중앙에 고정된 카드는 관성 계산에서 제외된다", () => {
    const { result, cardEls } = setupCards();
    const [cardEl] = cardEls;

    act(() => {
      result.current.handlePointerDown(0)(makePointerEvent(0, 0));
      result.current.handlePointerMove(0)(makePointerEvent(1, 0));
      result.current.bringToCenter(0);
      result.current.handlePointerUp(0)(makePointerEvent(1, 0));
    });

    const centered = getPos(cardEl);
    runFrame();

    expect(centered).toEqual({ x: 180, y: 130 });
    expect(getPos(cardEl)).toEqual(centered);
  });

  it("경계를 계산할 수 없으면 관성 계산을 건너뛴다", () => {
    const { result, cardEls, wallRef } = setupCards();
    const [cardEl] = cardEls;

    act(() => {
      result.current.handlePointerDown(0)(makePointerEvent(0, 0));
      result.current.handlePointerMove(0)(makePointerEvent(1, 0));
      result.current.handlePointerUp(0)(makePointerEvent(1, 0));
    });

    const before = getPos(cardEl);
    wallRef.current = null;
    runFrame();

    expect(getPos(cardEl)).toEqual(before);
  });

  it("등록되지 않은 카드에 pointerDown 하면 아무 동작도 하지 않는다", () => {
    const { result, cardEls } = setupCards();

    act(() => {
      result.current.handlePointerDown(5)(makePointerEvent(0, 0));
    });

    expect(cardEls[0].setPointerCapture).not.toHaveBeenCalled();
  });

  it("드래그 중이 아닌 카드의 pointerMove·pointerUp은 무시한다", () => {
    const { result, cardEls } = setupCards(2);
    const before = getPos(cardEls[1]);

    act(() => {
      result.current.handlePointerDown(0)(makePointerEvent(0, 0));
      result.current.handlePointerMove(1)(makePointerEvent(50, 50));
      result.current.handlePointerUp(1)(makePointerEvent(50, 50));
    });

    expect(getPos(cardEls[1])).toEqual(before);
    expect(cardEls[1].releasePointerCapture).not.toHaveBeenCalled();
  });

  it("포커스된 카드가 없으면 resetFocus는 아무 동작도 하지 않는다", () => {
    const { result, cardEls } = setupCards();
    const before = getPos(cardEls[0]);

    act(() => {
      result.current.resetFocus();
    });

    expect(getPos(cardEls[0])).toEqual(before);
    expect(cardEls[0].style.transition).toBe("");
  });

  it("이미 중앙에 있는 카드를 다시 잡으면 포커스와 트랜지션이 해제된다", () => {
    const { result, cardEls } = setupCards();
    const [cardEl] = cardEls;

    act(() => {
      result.current.bringToCenter(0);
      result.current.handlePointerDown(0)(makePointerEvent(0, 0));
    });

    expect(cardEl.style.transition).toBe("");
    expect(cardEl.style.zIndex).toBe("");
  });

  it("다른 카드를 중앙으로 보내면 기존 중앙 카드는 슬롯으로 복귀한다", () => {
    const { result, cardEls } = setupCards(2);

    act(() => {
      result.current.bringToCenter(0);
      result.current.bringToCenter(1);
    });

    expect(cardEls[0].style.zIndex).toBe("");
    expect(cardEls[1].style.zIndex).toBe("50");
    expect(getPos(cardEls[1])).toEqual({ x: 180, y: 130 });
  });

  it("등록되지 않은 카드는 중앙으로 이동시키지 않는다", () => {
    const { result, cardEls } = setupCards();

    act(() => {
      result.current.bringToCenter(3);
    });

    expect(cardEls[0].style.zIndex).toBe("");
  });

  it("isReady가 false면 카드를 배치하지 않는다", () => {
    const offsetParentRef = {
      current: makeElement({ width: 400, height: 300 }),
    } as RefObject<HTMLElement | null>;
    const wallRef = {
      current: makeElement({ width: 400, height: 300 }),
    } as RefObject<HTMLElement | null>;
    const { result } = renderHook(() => useScatterCards(offsetParentRef, wallRef, 1, false));
    const cardEl = makeElement({ width: 40, height: 40 });

    act(() => {
      result.current.setCardRef(0)(cardEl);
      window.dispatchEvent(new Event("resize"));
    });

    expect(cardEl.style.transform).toBe("");
  });

  it("컨테이너 ref가 비어 있으면 카드를 배치하지 않는다", () => {
    const offsetParentRef = { current: null } as RefObject<HTMLElement | null>;
    const wallRef = {
      current: makeElement({ width: 400, height: 300 }),
    } as RefObject<HTMLElement | null>;
    const { result } = renderHook(() => useScatterCards(offsetParentRef, wallRef, 1, true));
    const cardEl = makeElement({ width: 40, height: 40 });

    act(() => {
      result.current.setCardRef(0)(cardEl);
      window.dispatchEvent(new Event("resize"));
    });

    expect(cardEl.style.transform).toBe("");
  });

  it("카드보다 작은 보드에서는 카드를 최소 경계 안쪽에 배치한다", () => {
    const offsetParentRef = {
      current: makeElement({ width: 20, height: 20 }),
    } as RefObject<HTMLElement | null>;
    const wallRef = {
      current: makeElement({ width: 20, height: 20 }),
    } as RefObject<HTMLElement | null>;
    const { result } = renderHook(() => useScatterCards(offsetParentRef, wallRef, 1, true));
    const cardEl = makeElement({ width: 40, height: 40 });

    act(() => {
      result.current.setCardRef(0)(cardEl);
      window.dispatchEvent(new Event("resize"));
    });

    expect(getPos(cardEl)).toEqual({ x: 0, y: 0 }); // maxX < minX여도 음수로 밀리지 않는다
  });

  it("언마운트 시 진행 중인 물리 루프를 취소한다", () => {
    const { result, unmount } = setupCards();

    act(() => {
      result.current.handlePointerDown(0)(makePointerEvent(0, 0));
      result.current.handlePointerMove(0)(makePointerEvent(1, 0));
      result.current.handlePointerUp(0)(makePointerEvent(1, 0));
    });
    unmount();

    expect(cancelSpy).toHaveBeenCalled();
  });
});

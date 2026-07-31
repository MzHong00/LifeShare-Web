import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

describe("useScatterCards", () => {
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
});

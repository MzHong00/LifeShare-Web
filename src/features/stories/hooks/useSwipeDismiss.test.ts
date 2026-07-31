import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { useSwipeDismiss } from "./useSwipeDismiss";

const makePointerEvent = (x: number, y: number, pointerId = 1) =>
  ({
    clientX: x,
    clientY: y,
    pointerId,
    target: document.createElement("div"), // 버튼이 아닌 요소에서 시작한 포인터(인터랙티브 요소 가드 통과)
  }) as unknown as React.PointerEvent;

const setup = (onClose: () => void) => {
  const { result } = renderHook(() => useSwipeDismiss(onClose));
  const el = document.createElement("div");
  el.setPointerCapture = vi.fn();
  el.releasePointerCapture = vi.fn();
  Object.defineProperty(result.current.overlayRef, "current", {
    value: el,
    writable: true,
    configurable: true,
  });
  return { result, el };
};

describe("useSwipeDismiss", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("pointerDown 시 pointer capture를 설정하고 애니메이션/트랜지션을 끈다", () => {
    const onClose = vi.fn();
    const { result, el } = setup(onClose);

    act(() => {
      result.current.handlePointerDown(makePointerEvent(0, 0));
    });

    expect(el.setPointerCapture).toHaveBeenCalledWith(1);
    expect(el.style.animation).toBe("none");
    expect(el.style.transition).toBe("none");
  });

  it("가로 이동이 임계값 미만이면 스와이프로 진입하지 않아 transform을 바꾸지 않는다", () => {
    const onClose = vi.fn();
    const { result, el } = setup(onClose);

    act(() => {
      result.current.handlePointerDown(makePointerEvent(0, 0));
      result.current.handlePointerMove(makePointerEvent(5, 0));
    });

    expect(el.style.transform).toBe("");
  });

  it("세로 이동이 가로 이동보다 크면 스와이프로 진입하지 않는다", () => {
    const onClose = vi.fn();
    const { result, el } = setup(onClose);

    act(() => {
      result.current.handlePointerDown(makePointerEvent(0, 0));
      result.current.handlePointerMove(makePointerEvent(20, 30));
    });

    expect(el.style.transform).toBe("");
  });

  it("가로 스와이프가 진입 임계값을 넘으면 이동 거리만큼 transform/opacity를 갱신한다", () => {
    const onClose = vi.fn();
    const { result, el } = setup(onClose);

    act(() => {
      result.current.handlePointerDown(makePointerEvent(0, 0));
      result.current.handlePointerMove(makePointerEvent(50, 0));
    });

    expect(el.style.transform).toBe("translateX(50px)");
    expect(el.style.opacity).toBe(String(1 - 50 / 260));
  });

  it("pointerDown 없이 pointerMove가 발생해도 에러 없이 무시한다", () => {
    const onClose = vi.fn();
    const { result, el } = setup(onClose);

    expect(() => {
      act(() => {
        result.current.handlePointerMove(makePointerEvent(50, 0));
      });
    }).not.toThrow();
    expect(el.style.transform).toBe("");
  });

  it("드래그 거리가 닫힘 임계값 미만이면 pointerUp 시 제자리로 복귀한다", () => {
    const onClose = vi.fn();
    const { result, el } = setup(onClose);

    act(() => {
      result.current.handlePointerDown(makePointerEvent(0, 0));
      result.current.handlePointerMove(makePointerEvent(50, 0));
      result.current.handlePointerUp(makePointerEvent(50, 0));
    });

    expect(el.releasePointerCapture).toHaveBeenCalledWith(1);
    expect(el.style.transform).toBe("translateX(0)");
    expect(el.style.opacity).toBe("1");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("드래그 거리가 닫힘 임계값을 넘으면 화면 밖으로 날아가며 onClose를 예약 실행한다", () => {
    const onClose = vi.fn();
    const { result, el } = setup(onClose);

    act(() => {
      result.current.handlePointerDown(makePointerEvent(0, 0));
      result.current.handlePointerMove(makePointerEvent(150, 0));
      result.current.handlePointerUp(makePointerEvent(150, 0));
    });

    expect(el.style.transform).toBe(`translateX(${window.innerWidth}px)`);
    expect(el.style.opacity).toBe("0");
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(280);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("반대 방향으로 임계값을 넘으면 음수 방향으로 날아간다", () => {
    const onClose = vi.fn();
    const { result, el } = setup(onClose);

    act(() => {
      result.current.handlePointerDown(makePointerEvent(0, 0));
      result.current.handlePointerMove(makePointerEvent(-150, 0));
      result.current.handlePointerUp(makePointerEvent(-150, 0));
    });

    expect(el.style.transform).toBe(`translateX(${-window.innerWidth}px)`);
  });

  it("세로 이동으로 인해 스와이프가 진입되지 않았다면 가로 이동량이 커도 닫히지 않는다", () => {
    const onClose = vi.fn();
    const { result, el } = setup(onClose);

    act(() => {
      result.current.handlePointerDown(makePointerEvent(0, 0));
      result.current.handlePointerMove(makePointerEvent(150, 200));
      result.current.handlePointerUp(makePointerEvent(150, 200));
    });

    expect(el.style.transform).toBe("translateX(0)");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("pointerDown 없이 pointerUp이 발생해도 에러 없이 무시한다", () => {
    const onClose = vi.fn();
    const { result } = setup(onClose);

    expect(() => {
      act(() => {
        result.current.handlePointerUp(makePointerEvent(50, 0));
      });
    }).not.toThrow();
  });

  it("언마운트 시 예약된 닫기 타이머를 정리해 onClose가 호출되지 않는다", () => {
    const onClose = vi.fn();
    const { result, unmount } = renderHook(() => useSwipeDismiss(onClose));
    const el = document.createElement("div");
    el.setPointerCapture = vi.fn();
    el.releasePointerCapture = vi.fn();
    Object.defineProperty(result.current.overlayRef, "current", {
      value: el,
      writable: true,
      configurable: true,
    });

    act(() => {
      result.current.handlePointerDown(makePointerEvent(0, 0));
      result.current.handlePointerMove(makePointerEvent(150, 0));
      result.current.handlePointerUp(makePointerEvent(150, 0));
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(280);
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});

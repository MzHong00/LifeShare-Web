import { useCallback, useEffect, useRef } from "react";

interface CardSlot {
  top: number; // 컨테이너 세로 기준 쉬는 위치(%)
  left: number; // 컨테이너 가로 기준 쉬는 위치(%)
  rotate: number; // 쉬는 상태의 기울기(deg)
}

// 부채꼴 카드 뭉치(하단 영역) 위쪽 영역에 카드 15장을 손으로 흩뿌리듯 불규칙 배치.
// 열/행이 맞춰 보이지 않도록 좌표를 어긋나게 잡되, 서로 겹치지 않을 최소 간격은 유지해 여백이 남지 않게 함
// top은 상단 통계 오버레이(StoryBoardHeader)와 겹치지 않도록 전체적으로 아래로 밀어둔 값
const SLOTS: CardSlot[] = [
  { top: 14, left: 6, rotate: -14 },
  { top: 12, left: 35, rotate: 9 },
  { top: 21, left: 60, rotate: -6 },
  { top: 11, left: 84, rotate: 16 },
  { top: 33, left: 20, rotate: -11 },
  { top: 30, left: 46, rotate: 7 },
  { top: 25, left: 73, rotate: -9 },
  { top: 39, left: 92, rotate: 13 },
  { top: 46, left: 8, rotate: -15 },
  { top: 52, left: 33, rotate: 6 },
  { top: 43, left: 58, rotate: -8 },
  { top: 57, left: 80, rotate: 11 },
  { top: 64, left: 15, rotate: -13 },
  { top: 66, left: 44, rotate: 8 },
  { top: 60, left: 65, rotate: -10 },
];

const FOCUS_TRANSITION = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)"; // 중앙 이동/복귀 시 부드러운 트랜지션
const FRICTION = 0.94; // 프레임마다 속도가 줄어드는 비율
const BOUNCE_DAMPING = 0.55; // 벽에 부딪힐 때 반사되는 속도 감쇠 비율
const STOP_VELOCITY = 0.03; // 이 값 이하로 속도가 떨어지면 정지 처리
const VELOCITY_FRAME_MS = 16; // 속도를 프레임 단위(약 16ms)로 환산하는 기준
const CLICK_DRAG_THRESHOLD = 6; // 이 값(px) 이상 이동하면 던진 것으로 보고 클릭(상세 진입)을 막음
const FOCUSED_Z_INDEX = "50"; // 중앙으로 이동한 카드가 다른 카드 위에 보이도록 하는 z-index

interface CardPhysics {
  x: number; // 부모 기준 현재 x좌표(px)
  y: number; // 부모 기준 현재 y좌표(px)
  vx: number; // x축 속도(px/frame)
  vy: number; // y축 속도(px/frame)
  rotate: number; // 현재 기울기(deg)
}

interface DragPointer {
  x: number;
  y: number;
  t: number;
  distance: number; // 드래그 시작 이후 누적 이동 거리(px)
}

/**
 * 흩뿌려진 작은 카드를 꾹 눌러 드래그한 뒤 놓으면 관성으로 미끄러지다
 * 보드 벽에 부딪혀 튕기는 물리 인터랙션을 제공하는 훅.
 * 쉬는 위치와 벽 경계 모두 실제 렌더링된 픽셀 크기로 계산하므로
 * 컨테이너 경계에 카드가 겹치거나 잘리는 문제가 발생하지 않는다.
 */
export const useScatterCards = (
  offsetParentRef: React.RefObject<HTMLElement | null>,
  wallRef: React.RefObject<HTMLElement | null>,
  cardCount: number,
  isReady: boolean // 카드 DOM이 실제로 렌더링된 상태인지 (로딩 중엔 false — 마운트 시점에 재배치하기 위한 플래그)
) => {
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const physics = useRef<CardPhysics[]>([]);
  const dragIndex = useRef<number | null>(null);
  const dragPointer = useRef<DragPointer | null>(null);
  const dragBounds = useRef<ReturnType<typeof getBounds>>(null); // 드래그 시작 시 캐시한 벽 경계(pointermove마다 재계산 방지)
  const focusedIndex = useRef<number | null>(null); // 보드 중앙으로 이동한 카드 인덱스(없으면 null)
  const rafId = useRef<number | null>(null);

  /** index번째 카드 DOM 엘리먼트를 ref 배열에 등록하는 콜백을 만든다 */
  const setCardRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      cardRefs.current[index] = el;
    },
    []
  );

  /** 물리 상태(x·y·rotate)를 해당 카드의 transform 스타일에 반영한다 */
  const applyTransform = (index: number) => {
    const el = cardRefs.current[index];
    const p = physics.current[index];
    if (!el || !p) return;
    el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.rotate}deg)`;
  };

  /** 카드가 이동 가능한 벽 경계(px)를 컨테이너·벽·카드 실측 크기로 계산한다 */
  const getBounds = (index: number) => {
    const offsetParent = offsetParentRef.current;
    const wall = wallRef.current;
    const el = cardRefs.current[index];
    if (!offsetParent || !wall || !el) return null;

    const parentRect = offsetParent.getBoundingClientRect();
    const wallRect = wall.getBoundingClientRect();
    const cardWidth = el.offsetWidth;
    const cardHeight = el.offsetHeight;

    return {
      minX: Math.max(0, wallRect.left - parentRect.left),
      minY: Math.max(0, wallRect.top - parentRect.top),
      maxX: Math.min(parentRect.width, wallRect.right - parentRect.left) - cardWidth,
      maxY: Math.min(parentRect.height, wallRect.bottom - parentRect.top) - cardHeight,
    };
  };

  // 카드를 슬롯(쉬는 위치)으로 되돌려 배치. 실제 컨테이너 크기 기준으로 계산해 벽 안쪽에 clamp
  const restCard = (index: number) => {
    const offsetParent = offsetParentRef.current;
    const el = cardRefs.current[index];
    const bounds = getBounds(index);
    if (!offsetParent || !el || !bounds) return;

    const slot = SLOTS[index % SLOTS.length];
    const parentRect = offsetParent.getBoundingClientRect();
    const rawX = (slot.left / 100) * parentRect.width - el.offsetWidth / 2;
    const rawY = (slot.top / 100) * parentRect.height - el.offsetHeight / 2;

    physics.current[index] = {
      x: Math.min(Math.max(rawX, bounds.minX), Math.max(bounds.maxX, bounds.minX)),
      y: Math.min(Math.max(rawY, bounds.minY), Math.max(bounds.maxY, bounds.minY)),
      vx: 0,
      vy: 0,
      rotate: slot.rotate,
    };
    applyTransform(index);
  };

  // 중앙에 있던 카드를 슬롯으로 부드럽게 복귀시키고 포커스를 해제
  const resetFocus = () => {
    const index = focusedIndex.current;
    if (index === null) return;
    const el = cardRefs.current[index];
    focusedIndex.current = null;
    if (el) el.style.transition = FOCUS_TRANSITION;
    restCard(index);
    if (el) el.style.zIndex = "";
  };

  // 흩뿌려진 카드를 형태(크기) 그대로 보드 정중앙으로 이동(한 번에 하나만 중앙 유지)
  const bringToCenter = (index: number) => {
    const offsetParent = offsetParentRef.current;
    const el = cardRefs.current[index];
    const p = physics.current[index];
    if (!offsetParent || !el || !p) return;

    resetFocus();
    const parentRect = offsetParent.getBoundingClientRect();
    p.x = parentRect.width / 2 - el.offsetWidth / 2;
    p.y = parentRect.height / 2 - el.offsetHeight / 2;
    p.vx = 0;
    p.vy = 0;
    p.rotate = 0;
    focusedIndex.current = index;
    el.style.transition = FOCUS_TRANSITION;
    el.style.zIndex = FOCUSED_Z_INDEX;
    applyTransform(index);
  };

  /** 카드 마운트(isReady)·카드 수 변경·리사이즈 시 모든 카드를 슬롯 위치로 재배치한다 */
  useEffect(() => {
    // 로딩 중(카드 미렌더링)엔 refs가 비어 있으므로 스킵 — 마운트 후 isReady가 true로 바뀌면 재실행된다
    if (!isReady) return;
    const offsetParent = offsetParentRef.current;
    if (!offsetParent) return;

    const layout = () => cardRefs.current.forEach((_, index) => restCard(index));

    layout();
    window.addEventListener("resize", layout);
    return () => window.removeEventListener("resize", layout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardCount, isReady]);

  /** 매 프레임 관성 이동·마찰 감속·벽 반사를 계산하고 움직임이 남아 있으면 다음 프레임을 예약한다 */
  const stepPhysics = () => {
    let stillMoving = false;

    physics.current.forEach((p, index) => {
      if (index === dragIndex.current) return; // 드래그 중인 카드는 물리 계산 제외
      if (index === focusedIndex.current) return; // 중앙에 고정된 카드는 물리 계산 제외
      if (Math.abs(p.vx) < STOP_VELOCITY && Math.abs(p.vy) < STOP_VELOCITY) return;

      const bounds = getBounds(index);
      if (!bounds) return;

      let nextX = p.x + p.vx;
      let nextY = p.y + p.vy;
      let nextVx = p.vx * FRICTION;
      let nextVy = p.vy * FRICTION;

      if (nextX < bounds.minX) {
        nextX = bounds.minX;
        nextVx = -nextVx * BOUNCE_DAMPING;
      } else if (nextX > bounds.maxX) {
        nextX = bounds.maxX;
        nextVx = -nextVx * BOUNCE_DAMPING;
      }

      if (nextY < bounds.minY) {
        nextY = bounds.minY;
        nextVy = -nextVy * BOUNCE_DAMPING;
      } else if (nextY > bounds.maxY) {
        nextY = bounds.maxY;
        nextVy = -nextVy * BOUNCE_DAMPING;
      }

      p.x = nextX;
      p.y = nextY;
      p.vx = nextVx;
      p.vy = nextVy;
      applyTransform(index);
      stillMoving = true;
    });

    rafId.current = stillMoving ? requestAnimationFrame(stepPhysics) : null;
  };

  /** 물리 루프가 돌고 있지 않을 때만 rAF 루프를 시작한다 */
  const startPhysicsLoop = () => {
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(stepPhysics);
    }
  };

  /** 카드를 잡는 순간 드래그 상태를 초기화하고 포인터를 캡처한다 */
  const handlePointerDown = (index: number) => (event: React.PointerEvent<HTMLElement>) => {
    const el = cardRefs.current[index];
    const p = physics.current[index];
    if (!el || !p) return;

    // 다시 잡으면 중앙 포커스를 풀고 트랜지션을 제거해 드래그가 즉시 따라오게 함
    if (focusedIndex.current === index) focusedIndex.current = null;
    el.style.transition = "";
    el.style.zIndex = "";

    el.setPointerCapture(event.pointerId);
    dragIndex.current = index;
    dragPointer.current = { x: event.clientX, y: event.clientY, t: performance.now(), distance: 0 };
    dragBounds.current = getBounds(index); // 드래그 중엔 보드 크기가 바뀌지 않으므로 시작 시점에만 계산
    p.vx = 0;
    p.vy = 0;
  };

  /** 드래그 이동량을 위치에 반영하고 놓았을 때 쓸 순간 속도를 갱신한다 */
  const handlePointerMove = (index: number) => (event: React.PointerEvent<HTMLElement>) => {
    if (dragIndex.current !== index || !dragPointer.current) return;

    const bounds = dragBounds.current;
    const p = physics.current[index];
    if (!bounds || !p) return;

    const dx = event.clientX - dragPointer.current.x;
    const dy = event.clientY - dragPointer.current.y;
    const now = performance.now();
    const dt = Math.max(now - dragPointer.current.t, 1);

    p.x = Math.min(Math.max(p.x + dx, bounds.minX), bounds.maxX);
    p.y = Math.min(Math.max(p.y + dy, bounds.minY), bounds.maxY);
    p.vx = (dx / dt) * VELOCITY_FRAME_MS;
    p.vy = (dy / dt) * VELOCITY_FRAME_MS;
    applyTransform(index);

    dragPointer.current = {
      x: event.clientX,
      y: event.clientY,
      t: now,
      distance: dragPointer.current.distance + Math.hypot(dx, dy),
    };
  };

  /** 드래그를 끝내고 관성 물리 루프를 시작하며, 던진 경우 후속 클릭을 1회 차단한다 */
  const handlePointerUp = (index: number) => (event: React.PointerEvent<HTMLElement>) => {
    if (dragIndex.current !== index) return;

    const el = cardRefs.current[index];
    const wasThrown = (dragPointer.current?.distance ?? 0) > CLICK_DRAG_THRESHOLD;
    el?.releasePointerCapture(event.pointerId);
    dragIndex.current = null;
    dragPointer.current = null;
    dragBounds.current = null;
    startPhysicsLoop();

    // 던지는 동작으로 판단되면 뒤이어 발생하는 클릭(상세 진입)을 1회 차단
    if (wasThrown && el) {
      const blockClick = (clickEvent: MouseEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
      };
      el.addEventListener("click", blockClick, { capture: true, once: true });
    }
  };

  /** 언마운트 시 진행 중인 rAF 물리 루프를 취소한다 */
  useEffect(
    () => () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    },
    []
  );

  return {
    setCardRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    bringToCenter,
    resetFocus,
  };
};

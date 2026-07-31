"use client";
import { useEffect, useRef } from "react";

const SWIPE_ENGAGE_MIN_DX = 8; // 이 거리(px) 이상 가로로 움직여야 스와이프로 판정(세로 스크롤과 구분)
const SWIPE_CLOSE_THRESHOLD = 90; // 이 거리(px)를 넘겨 놓으면 상세 오버레이가 그 방향으로 날아가며 닫힘
const SWIPE_FADE_DISTANCE = 260; // 이 거리(px)만큼 스와이프하면 완전히 투명해지는 기준
const SWIPE_OUT_MS = 280; // 스와이프 아웃 애니메이션 시간(ms)
const SWIPE_TRANSITION = `transform ${SWIPE_OUT_MS}ms ease, opacity ${SWIPE_OUT_MS}ms ease`;

/**
 * 좌우 포인터 스와이프로 오버레이를 닫는 제스처 로직.
 * 60fps 드래그 추적을 위해 React state가 아닌 ref.style 직접 조작으로 프레임마다 갱신한다.
 * @param onClose 임계값 초과 시 닫기 콜백
 */
export const useSwipeDismiss = (onClose: () => void) => {
  const overlayRef = useRef<HTMLDivElement>(null); // 오버레이 엘리먼트(스와이프 중 transform 직접 제어)
  const swipeRef = useRef<{ x: number; y: number; engaged: boolean } | null>(null); // 스와이프 시작 좌표·가로 스와이프 진입 여부
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined); // 스와이프 아웃 애니메이션 후 닫기 예약 타이머

  // 언마운트 시 스와이프 아웃 예약 타이머 정리
  useEffect(() => () => clearTimeout(dismissTimerRef.current), []);

  const handlePointerDown = (e: React.PointerEvent) => {
    const el = overlayRef.current;
    if (!el) return;
    // 버튼 등 인터랙티브 요소 위에서 시작한 포인터는 캡처하지 않음 — 캡처 시 이후 pointerup이 오버레이로 리타겟되어 버튼 클릭이 씹힘
    if ((e.target as HTMLElement).closest("button")) return;
    el.setPointerCapture(e.pointerId); // 드래그 중 오버레이가 커서 아래에서 벗어나도 move/up 이벤트를 계속 받기 위함
    swipeRef.current = { x: e.clientX, y: e.clientY, engaged: false };
    el.style.animation = "none"; // 등장 애니메이션이 인라인 transform을 덮지 않도록 제거
    el.style.transition = "none"; // 손가락을 즉시 따라오도록 트랜지션 끄기
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const swipe = swipeRef.current;
    const el = overlayRef.current;
    if (!swipe || !el) return;

    const dx = e.clientX - swipe.x;
    const dy = e.clientY - swipe.y;
    // 세로 스크롤과 구분: 가로 이동이 우세할 때만 스와이프로 진입
    if (!swipe.engaged) {
      if (Math.abs(dx) < SWIPE_ENGAGE_MIN_DX || Math.abs(dx) <= Math.abs(dy)) return;
      swipe.engaged = true;
    }
    // 스와이프한 만큼 오버레이를 이동시키고 거리에 비례해 투명하게
    el.style.transform = `translateX(${dx}px)`;
    el.style.opacity = String(Math.max(0, 1 - Math.abs(dx) / SWIPE_FADE_DISTANCE));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const swipe = swipeRef.current;
    const el = overlayRef.current;
    swipeRef.current = null;
    if (!swipe || !el) return;

    el.releasePointerCapture(e.pointerId);
    const dx = e.clientX - swipe.x;
    el.style.transition = SWIPE_TRANSITION;

    if (swipe.engaged && Math.abs(dx) > SWIPE_CLOSE_THRESHOLD) {
      // 스와이프 방향으로 화면 밖까지 날려보내며 사라지게 한 뒤 닫기
      const direction = dx > 0 ? 1 : -1;
      el.style.transform = `translateX(${direction * window.innerWidth}px)`;
      el.style.opacity = "0";
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(onClose, SWIPE_OUT_MS);
    } else {
      // 임계값 미만이면 제자리로 부드럽게 복귀
      el.style.transform = "translateX(0)";
      el.style.opacity = "1";
    }
  };

  return { overlayRef, handlePointerDown, handlePointerMove, handlePointerUp };
};

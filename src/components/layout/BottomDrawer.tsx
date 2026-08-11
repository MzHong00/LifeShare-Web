"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";

import styles from "./BottomDrawer.module.scss";

import type { CSSProperties } from "react";

const SNAP_DRAG_THRESHOLD = 30; // 이 픽셀 이상 드래그해야 다음 앵커로 스냅
const SNAP_ANCHOR_GAP = 10; // 현재 높이와 앵커 간 최소 간격(px)

interface BottomDrawerProps {
  children: React.ReactNode;
  initialHeightRatio?: number;
  minHeight?: number;
  maxHeightRatio?: number;
  /** 드로어 하단 오프셋(CSS 값). 기본값은 BottomNav가 노출하는 --gnb-height 변수를 참조해 GNB에 밀착시킨다 */
  bottomOffset?: string;
}

/** 드래그로 높이를 조절할 수 있는 하단 드로어. 앵커(최소/중간/최대) 스냅을 지원한다 */
export const BottomDrawer = ({
  children,
  initialHeightRatio = 0.45,
  minHeight = 40,
  maxHeightRatio = 0.8,
  bottomOffset = "0px",
}: BottomDrawerProps) => {
  // ref로 관리해서 클로저 이슈 방지
  const isDragging = useRef(false);
  const touchStartY = useRef(0);
  const initialDrawerHeight = useRef(0);
  const drawerHeightRef = useRef(minHeight);
  const handleRef = useRef<HTMLButtonElement>(null);

  // 기본 상태는 접힘(minHeight) — 사용자가 핸들을 드래그해야 펼쳐짐
  const [drawerHeight, setDrawerHeight] = useState(minHeight);
  const [isDraggingState, setIsDraggingState] = useState(false);

  /** 드래그 종료 시점의 높이·이동 방향을 바탕으로 가장 가까운 앵커 높이를 계산한다 */
  const snapHeight = useCallback(
    (currentHeight: number, delta: number) => {
      const midHeight = window.innerHeight * initialHeightRatio;
      const maxHeight = window.innerHeight * maxHeightRatio;
      const anchors = [minHeight, midHeight, maxHeight];

      if (delta > SNAP_DRAG_THRESHOLD) {
        return anchors.find((a) => a > initialDrawerHeight.current + SNAP_ANCHOR_GAP) ?? maxHeight;
      } else if (delta < -SNAP_DRAG_THRESHOLD) {
        return (
          [...anchors].reverse().find((a) => a < initialDrawerHeight.current - SNAP_ANCHOR_GAP) ??
          minHeight
        );
      } else {
        return anchors.reduce((prev, curr) =>
          Math.abs(curr - currentHeight) < Math.abs(prev - currentHeight) ? curr : prev
        );
      }
    },
    [initialHeightRatio, maxHeightRatio, minHeight]
  );

  /** 드래그 시작 시 초기 좌표·높이를 기록하고 텍스트 선택/pull-to-refresh를 차단한다 */
  const onDragStart = useCallback((clientY: number) => {
    touchStartY.current = clientY;
    initialDrawerHeight.current = drawerHeightRef.current;
    isDragging.current = true;
    setIsDraggingState(true);
    // 드래그 중 텍스트 선택 및 pull-to-refresh 방지
    document.body.style.userSelect = "none";
    document.documentElement.style.overscrollBehavior = "none";
  }, []);

  /** 드래그 이동량만큼 드로어 높이를 실시간으로 갱신한다 */
  const onDragMove = useCallback(
    (clientY: number) => {
      if (!isDragging.current) return;
      const deltaY = clientY - touchStartY.current;
      const maxHeight = window.innerHeight * maxHeightRatio;
      const newHeight = Math.max(
        minHeight,
        Math.min(maxHeight, initialDrawerHeight.current - deltaY)
      );
      drawerHeightRef.current = newHeight;
      setDrawerHeight(newHeight);
    },
    [minHeight, maxHeightRatio]
  );

  /** 드래그 종료 시 스타일을 복원하고 가장 가까운 앵커 높이로 스냅한다 */
  const onDragEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setIsDraggingState(false);
    document.body.style.userSelect = "";
    document.documentElement.style.overscrollBehavior = "";

    const currentHeight = drawerHeightRef.current;
    const delta = currentHeight - initialDrawerHeight.current;
    setDrawerHeight(snapHeight(currentHeight, delta));
  }, [snapHeight]);

  /** 드래그 콜백에서 최신 높이를 참조할 수 있도록 ref에 동기화한다 */
  useEffect(() => {
    drawerHeightRef.current = drawerHeight;
  }, [drawerHeight]);

  /** 전역 mouse 이벤트를 구독해 드래그 이동/종료를 처리한다 */
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => onDragMove(e.clientY);
    const onMouseUp = () => onDragEnd();
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [onDragMove, onDragEnd]);

  /** 전역 touch 이벤트를 구독한다 — passive: false 로 등록해야 preventDefault 작동 */
  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      e.preventDefault(); // pull-to-refresh / 페이지 스크롤 차단
      onDragMove(e.touches[0].clientY);
    };
    const onTouchEnd = () => onDragEnd();
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [onDragMove, onDragEnd]);

  /** 핸들의 touchstart도 passive: false 로 직접 등록한다 */
  useEffect(() => {
    const el = handleRef.current;
    if (!el) return;
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      onDragStart(e.touches[0].clientY);
    };
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    return () => el.removeEventListener("touchstart", onTouchStart);
  }, [onDragStart]);

  return (
    <div
      className={styles.drawer}
      data-dragging={isDraggingState}
      style={
        {
          "--drawer-height": `${drawerHeight}px`,
          "--drawer-bottom-offset": bottomOffset,
        } as CSSProperties
      }
    >
      <button
        ref={handleRef}
        type="button"
        className={styles.drawerHandle}
        onMouseDown={(e) => {
          e.preventDefault();
          onDragStart(e.clientY);
        }}
        aria-label="드로어 높이 조절"
      />
      <div className={styles.drawerContent}>{children}</div>
    </div>
  );
};

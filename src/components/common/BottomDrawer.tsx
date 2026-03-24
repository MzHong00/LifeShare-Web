"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./BottomDrawer.module.scss";

interface BottomDrawerProps {
  children: React.ReactNode;
  initialHeightRatio?: number;
  minHeight?: number;
  maxHeightRatio?: number;
  bottomOffset?: number;
}

export const BottomDrawer = ({
  children,
  initialHeightRatio = 0.45,
  minHeight = 40,
  maxHeightRatio = 0.8,
  bottomOffset = 60,
}: BottomDrawerProps) => {
  const [drawerHeight, setDrawerHeight] = useState(300);
  const [isDraggingState, setIsDraggingState] = useState(false);

  // ref로 관리해서 클로저 이슈 방지
  const isDragging = useRef(false);
  const touchStartY = useRef(0);
  const initialDrawerHeight = useRef(0);
  const drawerHeightRef = useRef(drawerHeight);
  const handleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    drawerHeightRef.current = drawerHeight;
  }, [drawerHeight]);

  useEffect(() => {
    setDrawerHeight(window.innerHeight * initialHeightRatio);
  }, [initialHeightRatio]);

  const snapHeight = useCallback(
    (currentHeight: number, delta: number) => {
      const midHeight = window.innerHeight * initialHeightRatio;
      const maxHeight = window.innerHeight * maxHeightRatio;
      const anchors = [minHeight, midHeight, maxHeight];

      if (delta > 30) {
        return anchors.find((a) => a > initialDrawerHeight.current + 10) ?? maxHeight;
      } else if (delta < -30) {
        return [...anchors].reverse().find((a) => a < initialDrawerHeight.current - 10) ?? minHeight;
      } else {
        return anchors.reduce((prev, curr) =>
          Math.abs(curr - currentHeight) < Math.abs(prev - currentHeight) ? curr : prev
        );
      }
    },
    [initialHeightRatio, maxHeightRatio, minHeight]
  );

  const onDragStart = useCallback((clientY: number) => {
    touchStartY.current = clientY;
    initialDrawerHeight.current = drawerHeightRef.current;
    isDragging.current = true;
    setIsDraggingState(true);
    // 드래그 중 텍스트 선택 및 pull-to-refresh 방지
    document.body.style.userSelect = "none";
    document.documentElement.style.overscrollBehavior = "none";
  }, []);

  const onDragMove = useCallback(
    (clientY: number) => {
      if (!isDragging.current) return;
      const deltaY = clientY - touchStartY.current;
      const maxHeight = window.innerHeight * maxHeightRatio;
      const newHeight = Math.max(minHeight, Math.min(maxHeight, initialDrawerHeight.current - deltaY));
      drawerHeightRef.current = newHeight;
      setDrawerHeight(newHeight);
    },
    [minHeight, maxHeightRatio]
  );

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

  // 전역 mouse 이벤트
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

  // 전역 touch 이벤트 — passive: false 로 등록해야 preventDefault 작동
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

  // 핸들의 touchstart도 passive: false 로 직접 등록
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
      style={{
        height: `${drawerHeight}px`,
        bottom: `${bottomOffset}px`,
        transition: isDraggingState ? "none" : "height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
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

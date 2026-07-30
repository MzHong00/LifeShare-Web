import type { ReactNode } from "react";

export interface ModalConfig {
  type: "alert" | "confirm"; // alert: 확인 버튼만, confirm: 확인/취소 버튼
  title: string; // 모달 제목
  message?: string; // 본문 텍스트
  content?: ReactNode; // 커스텀 본문 (message 대신 사용)
  confirmText?: string; // 확인 버튼 라벨 (기본 "확인")
  cancelText?: string; // 취소 버튼 라벨 (기본 "취소")
  confirmPhrase?: string; // 지정 시 이 문구를 그대로 입력해야 확인 버튼이 열린다 (되돌릴 수 없는 작업용)
  /** 확인 클릭 콜백 */
  onConfirm?: () => void;
  /** 취소/닫기 콜백 */
  onCancel?: () => void;
}

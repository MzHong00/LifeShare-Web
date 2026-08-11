import { ShieldCheck, Megaphone } from "lucide-react";

import { ICON_SIZE } from "@/constants/style";
import { ROUTES } from "@/constants/routes";
import { toastActions } from "@/stores/useToastStore";

import type { ReactNode } from "react";

/** 알림·지원 메뉴 리스트 단일 항목 */
export interface ProfileMenuItem {
  id: string; // 항목 고유 키
  label: string; // 표시 라벨
  subText: string; // 우측 보조 텍스트
  route?: string; // 이동 경로
  /** route 대신 실행할 커스텀 동작 */
  onClick?: () => void;
  icon: ReactNode; // 아이콘 노드
  colorClass: "blue" | "green" | "grey"; // 아이콘 박스 색상 클래스명
}

export const PROFILE_MENU_ITEMS: ProfileMenuItem[] = [
  {
    id: "privacy",
    label: "개인정보 처리방침",
    subText: "약관 및 정책",
    route: ROUTES.PROFILE.PRIVACY.path,
    icon: <ShieldCheck size={ICON_SIZE.lg} color="var(--grey-700)" />,
    colorClass: "grey",
  },
  {
    id: "notices",
    label: "공지사항",
    subText: "새로운 소식",
    onClick: () => toastActions.showToast("준비중입니다", "info"),
    icon: <Megaphone size={ICON_SIZE.lg} color="var(--primary)" />,
    colorClass: "blue",
  },
];

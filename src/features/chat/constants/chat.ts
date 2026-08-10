import { Image, Camera, MapPin, Gift } from "lucide-react";

import type { LucideIcon } from "lucide-react";

export const AVATAR_FALLBACK_NAME = "?"; // 이름 없는 멤버의 아바타 이니셜 대체값
export const UNKNOWN_SENDER_NAME = "알 수 없음"; // 워크스페이스를 나간 멤버 등 발신자를 찾지 못했을 때 표시명

interface ChatActionItem {
  id: string;
  Icon: LucideIcon;
  label: string;
}

// 입력바 도구함 아이템 목록
export const CHAT_ACTION_ITEMS: ChatActionItem[] = [
  { id: "gallery", Icon: Image, label: "갤러리" },
  { id: "camera", Icon: Camera, label: "카메라" },
  { id: "location", Icon: MapPin, label: "위치" },
  { id: "gift", Icon: Gift, label: "선물" },
];

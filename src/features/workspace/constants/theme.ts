import type { ThemeColor } from "@/features/workspace/types/workspace";

// 워크스페이스별 themeColor를 실제 액센트 색상값으로 매핑 (globals.scss의 --theme-accent 값과 동일하게 유지)
export const WORKSPACE_THEME_ACCENT: Record<ThemeColor, string> = {
  pink: "#ec4899",
  blue: "#38bdf8",
  twilight: "#fb7185",
  yellow: "#facc15",
  green: "#4ade80",
};

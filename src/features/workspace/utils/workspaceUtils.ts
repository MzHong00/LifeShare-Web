import { ROUTES } from "@/constants/routes";

/** 초대 코드로 참여 링크를 만든다 */
export const buildInviteLink = (code: string) =>
  `${window.location.origin}${ROUTES.WORKSPACE.join(code)}`;

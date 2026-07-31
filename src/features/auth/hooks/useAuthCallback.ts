import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { authApi } from "@/features/auth/api/auth";
import { profileApi } from "@/features/profile/api/profile";
import { workspaceActions } from "@/features/workspace/stores/useWorkspaceStore";
import { workspacesApi } from "@/features/workspace/api/workspaces";
import { isSafeRedirectPath } from "@/utils/route";

/** OAuth 콜백 처리: 세션 확보 후 워크스페이스 조회 결과에 따라 적절한 경로로 리다이렉트한다 */
export const useAuthCallback = (redirectPath: string | null) => {
  const router = useRouter();
  const safeRedirectPath = isSafeRedirectPath(redirectPath) ? redirectPath : null;

  useEffect(() => {
    const handleCallback = async () => {
      // 세션 확보 (OAuth 리다이렉트 후 URL 해시 파싱). 세션·유저는 Supabase가 자체 관리
      const session = await authApi.getSession();
      if (!session) {
        router.replace(ROUTES.LOGIN.path);
        return;
      }

      // 최초 로그인이면 profiles row가 없으므로 구글 메타데이터로 생성한다 (이후엔 getProfile이 profiles만 읽음)
      await profileApi.createProfile();

      // 워크스페이스 조회 후 분기
      try {
        const workspaces = await workspacesApi.listMine();
        if (workspaces.length > 0) {
          workspaceActions.setCurrentWorkspaceId(workspaces[0].id);
        }
        router.replace(
          safeRedirectPath ||
            (workspaces.length > 0 ? ROUTES.HOME.path : ROUTES.WORKSPACE.LANDING.path)
        );
      } catch {
        router.replace(safeRedirectPath || ROUTES.WORKSPACE.LANDING.path);
      }
    };

    handleCallback();
  }, [router, safeRedirectPath]);
};

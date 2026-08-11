import { supabase } from "@/lib/supabase/client";
import { ENV } from "@/constants/config";
import { ROUTES } from "@/constants/routes";

const GOOGLE_OAUTH_SCOPES = "openid email profile"; // 구글 OAuth 요청 스코프
const TEST_ACCOUNT_MISSING_MESSAGE = "체험 계정이 설정되지 않았습니다.";

export const authApi = {
  /** 구글 OAuth 로그인을 시작한다 */
  signInWithGoogle: async (redirectPath?: string): Promise<void> => {
    const callbackUrl = new URL(ROUTES.AUTH.CALLBACK.path, window.location.origin);
    if (redirectPath) callbackUrl.searchParams.set("redirect", redirectPath);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        scopes: GOOGLE_OAUTH_SCOPES,
      },
    });
    if (error) throw error;
  },

  /**
   * 공용 테스트 계정으로 로그인한다. OAuth와 달리 외부 리다이렉트가 없어 즉시 세션이 확보되므로,
   * 이후 처리(프로필 생성·워크스페이스 분기)는 호출부가 콜백 경로로 이동해 OAuth와 동일한 흐름을 태운다
   */
  signInWithTestAccount: async (): Promise<void> => {
    if (!ENV.TEST_ACCOUNT_EMAIL || !ENV.TEST_ACCOUNT_PASSWORD)
      throw new Error(TEST_ACCOUNT_MISSING_MESSAGE);
    const { error } = await supabase.auth.signInWithPassword({
      email: ENV.TEST_ACCOUNT_EMAIL,
      password: ENV.TEST_ACCOUNT_PASSWORD,
    });
    if (error) throw error;
  },

  /** 로그아웃한다 */
  signOut: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /** 현재 세션을 조회한다 */
  getSession: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },
};

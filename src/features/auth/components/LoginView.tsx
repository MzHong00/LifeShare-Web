"use client";
import { Heart } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  useTestAccountLoginMutation,
  useGoogleLoginMutation,
} from "@/features/auth/queries/authMutations";
import { toastActions } from "@/stores/useToastStore";
import { isSafeRedirectPath } from "@/utils/route";
import { KakaoIcon } from "@/assets/icons/KakaoIcon";
import { GoogleIcon } from "@/assets/icons/GoogleIcon";
import { APP_BRAND_NAME } from "@/constants/config";
import { ROUTES } from "@/constants/routes";
import { ICON_SIZE } from "@/constants/style";
import styles from "./LoginView.module.scss";

const GOOGLE_LOGIN_ERROR_MESSAGE = "구글 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.";
const KAKAO_LOGIN_PENDING_MESSAGE = "카카오 로그인은 준비 중입니다.";
const TEST_ACCOUNT_LOGIN_ERROR_MESSAGE =
  "체험하기 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.";

export const LoginView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirectPath = searchParams.get("redirect");
  const redirectPath = isSafeRedirectPath(rawRedirectPath) ? rawRedirectPath : undefined; // 로그인 후 복귀할 원래 경로(오픈 리다이렉트 방지)
  const { mutate: loginWithGoogle, isPending: isGoogleLoginPending } = useGoogleLoginMutation();
  const { mutate: loginWithTestAccount, isPending: isTestAccountLoginPending } =
    useTestAccountLoginMutation();

  /** 카카오 로그인 (준비 중) */
  const handleKakaoLogin = () => {
    toastActions.showToast(KAKAO_LOGIN_PENDING_MESSAGE, "info");
  };

  /** 구글 OAuth 로그인 처리 */
  const handleGoogleLogin = () => {
    loginWithGoogle(redirectPath, {
      onError: () => toastActions.showToast(GOOGLE_LOGIN_ERROR_MESSAGE, "error"),
    });
  };

  /** 공용 테스트 계정 로그인 — 세션 확보 후 OAuth와 같은 콜백 경로를 태워 후처리를 일치시킨다 */
  const handleTestAccountLogin = () => {
    loginWithTestAccount(undefined, {
      onSuccess: () => router.replace(ROUTES.AUTH.CALLBACK.query({ redirect: redirectPath })),
      onError: () => toastActions.showToast(TEST_ACCOUNT_LOGIN_ERROR_MESSAGE, "error"),
    });
  };

  return (
    <main className={styles.main}>
      {/* 배경 데코레이션: 은은하게 떠다니는 폴라로이드 카드 (장식용) */}
      <div className={styles.decoLayer} aria-hidden="true">
        <div className={styles.polaroid} />
        <div className={styles.polaroid} />
        <div className={styles.polaroid} />
      </div>

      <div className={styles.inner}>
        <div className={styles.logoSection}>
          <div className={styles.logoWrap}>
            <Heart size={ICON_SIZE["3xl"]} fill="var(--primary)" color="var(--primary)" />
          </div>
          <h1 className={styles.appName}>{APP_BRAND_NAME.KR}</h1>
          <p className={styles.appDesc}>우리의 소중한 일상을 함께 나누는 공간</p>
        </div>

        <div className={styles.buttons}>
          <button onClick={handleKakaoLogin} className={styles.kakaoButton}>
            <KakaoIcon />
            카카오톡으로 시작하기
          </button>
          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoginPending}
            className={styles.googleButton}
          >
            <GoogleIcon />
            Google로 시작하기
          </button>
          <button
            onClick={handleTestAccountLogin}
            disabled={isTestAccountLoginPending}
            className={styles.testAccountButton}
          >
            가입 없이 체험해보기
          </button>
        </div>

        <p className={styles.terms}>
          로그인 시 {APP_BRAND_NAME.KR}의 이용약관 및{"\n"}개인정보 처리방침에 동의하게 됩니다.
        </p>
      </div>
    </main>
  );
};

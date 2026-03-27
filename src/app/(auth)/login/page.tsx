"use client";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { workspaceActions } from "@/stores/useWorkspaceStore";
import { MOCK_DATA } from "@/constants/mockData";
import type { User } from "@/types";
import { ENV } from "@/constants/config";
import { KakaoIcon, GoogleIcon } from "@/assets/icons";
import styles from "./login.module.scss";

const LoginContent = () => {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleMockLogin = (provider: "google" | "kakao") => {
    // 실제 백엔드가 연결되기 전까진 목업 데이터로 임시 로그인 시킵니다.
    const user: User = {
      id: MOCK_DATA.user.id,
      name: MOCK_DATA.user.name,
      email: MOCK_DATA.user.email,
      profileImage: MOCK_DATA.user.profileImage,
    };
    setAuth(user, "mock-access-token");
    workspaceActions.initMockData();
    router.replace("/home");
  };

  const loginWithGoogle = () => {
    const redirectUri = `${window.location.origin}/auth/callback`;
    const params = new URLSearchParams({
      client_id: ENV.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "token",
      scope: "openid email profile",
      include_granted_scopes: "true",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  return (
    <main className={styles.main}>
      <div className={styles.inner}>
        <div className={styles.logoSection}>
          <div className={styles.logoWrap}>
            <Heart size={40} fill="#3182F6" color="#3182F6" />
          </div>
          <h1 className={styles.appName}>라이프쉐어</h1>
          <p className={styles.appDesc}>우리의 소중한 일상을 함께 나누는 공간</p>
        </div>

        <div className={styles.buttons}>
          <button onClick={() => handleMockLogin("kakao")} className={styles.kakaoButton}>
            <KakaoIcon />
            카카오톡으로 시작하기
          </button>
          <button onClick={loginWithGoogle} className={styles.googleButton}>
            <GoogleIcon />
            Google로 시작하기
          </button>
        </div>

        <p className={styles.terms}>
          로그인 시 라이프쉐어의 이용약관 및{"\n"}개인정보 처리방침에 동의하게 됩니다.
        </p>
      </div>
    </main>
  );
}

const LoginPage = () => {
  return <LoginContent />;
};

export default LoginPage;

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { authActions } from "@/stores/useAuthStore";
import { workspaceActions } from "@/stores/useWorkspaceStore";
import type { User } from "@/types";

interface GoogleUserInfo {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((profile: GoogleUserInfo) => {
        const user: User = {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          profileImage: profile.picture,
        };
        authActions.setAuth(user, accessToken);
        workspaceActions.initMockData();
        router.replace("/home");
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        backgroundColor: "#ffffff",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "3px solid var(--primary)",
          borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ fontSize: 14, color: "var(--grey-500)", fontWeight: 500 }}>
        로그인 중입니다...
      </p>
    </div>
  );
}

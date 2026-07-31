import "server-only";

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { ENV } from "@/constants/config";
import { ROUTES, PUBLIC_PATH_PREFIXES } from "@/constants/routes";

/** 요청 쿠키의 세션 토큰을 갱신하고, 갱신된 쿠키가 실린 응답과 로그인 여부를 반환 */
const updateSession = async (request: NextRequest) => {
  let response = NextResponse.next({ request });

  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_PUBLISHABLE_KEY) {
    return { response, isAuthenticated: false };
  }

  const supabase = createServerClient(ENV.SUPABASE_URL, ENV.SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // getClaims는 JWT 서명을 로컬 검증(비대칭 키)해 Auth 서버 왕복 없이 로그인 여부 판별
  const { data } = await supabase.auth.getClaims();

  return { response, isAuthenticated: !!data?.claims };
};

/** 비로그인 상태로 접근 가능한 경로인지 판별 */
const isPublicPath = (pathname: string): boolean =>
  pathname === "/" || PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

/** 비로그인 API 요청을 401 JSON으로 차단 (bffFetch가 파싱 가능하도록) · 해당 없으면 null */
const guardApiAuth = (request: NextRequest, isAuthenticated: boolean) => {
  const { pathname } = request.nextUrl;
  if (isAuthenticated || !pathname.startsWith("/api")) return null;
  return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
};

/** 비로그인 페이지 요청을 로그인 페이지로 리다이렉트 (원래 경로는 redirect 쿼리로 보존) · 해당 없으면 null */
const guardPageAuth = (request: NextRequest, isAuthenticated: boolean) => {
  const { pathname } = request.nextUrl;
  if (isAuthenticated || isPublicPath(pathname)) return null;

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = ROUTES.LOGIN.path;
  loginUrl.search = `?redirect=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(loginUrl);
};

/** 세션 쿠키 갱신 후 guard를 순서대로 적용 — 차단되면 해당 응답, 모두 통과하면 세션 갱신 응답 */
export async function proxy(request: NextRequest) {
  const { response, isAuthenticated } = await updateSession(request);

  return (
    guardApiAuth(request, isAuthenticated) ?? guardPageAuth(request, isAuthenticated) ?? response
  );
}

export const config = {
  // 정적 리소스·이미지·파비콘 제외 전체 경로에 적용
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

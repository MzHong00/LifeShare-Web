import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { COOKIE_KEYS } from "@/constants/config";
import { ROUTES } from "@/constants/routes";
import { createServerSupabase } from "@/server/common/utils/supabaseClient";

export default async function RootPage() {
  const supabase = await createServerSupabase();
  // getClaims는 JWT 서명을 로컬 검증(비대칭 키)해 Auth 서버 왕복 없이 로그인 여부만 판별한다
  // (앱 첫 진입 경로라 왕복 1회가 그대로 첫 화면 지연으로 이어짐)
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) redirect(ROUTES.LOGIN.path);

  const workspaceId = (await cookies()).get(COOKIE_KEYS.WORKSPACE_ID)?.value;
  redirect(workspaceId ? ROUTES.HOME.path : ROUTES.WORKSPACE.LANDING.path);
}

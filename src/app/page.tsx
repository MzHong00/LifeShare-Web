import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { COOKIE_KEYS } from "@/constants/config";
import { ROUTES } from "@/constants/routes";
import { createServerSupabase } from "@/server/common/utils/supabaseClient";

export default async function RootPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(ROUTES.LOGIN.path);

  const workspaceId = (await cookies()).get(COOKIE_KEYS.WORKSPACE_ID)?.value;
  redirect(workspaceId ? ROUTES.HOME.path : ROUTES.WORKSPACE.LANDING.path);
}

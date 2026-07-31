import { ProfileView } from "@/features/profile/components/ProfileView";
import { PAGE_TITLES } from "@/constants/seo";

import type { Metadata } from "next";

export const metadata: Metadata = { title: PAGE_TITLES.PROFILE };

export default function Page() {
  return <ProfileView />;
}

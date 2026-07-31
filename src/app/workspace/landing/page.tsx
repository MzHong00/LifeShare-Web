import { WorkspaceLandingView } from "@/features/workspace/components/WorkspaceLandingView";
import { INDEXABLE_ROBOTS, PAGE_TITLES } from "@/constants/seo";

import type { Metadata } from "next";

const PAGE_DESCRIPTION = "연인, 가족과 함께 일상과 추억을 기록하는 공간, 듀어스를 시작해보세요."; // 랜딩 메타 설명

export const metadata: Metadata = {
  title: PAGE_TITLES.WORKSPACE_LANDING,
  description: PAGE_DESCRIPTION,
  robots: INDEXABLE_ROBOTS,
  openGraph: {
    title: PAGE_TITLES.WORKSPACE_LANDING,
    description: PAGE_DESCRIPTION,
  },
};

export default function Page() {
  return <WorkspaceLandingView />;
}

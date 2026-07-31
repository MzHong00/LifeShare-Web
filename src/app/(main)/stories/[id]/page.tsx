import { StoryDetailView } from "@/features/stories/components/StoryDetailView";
import { PAGE_TITLES } from "@/constants/seo";

import type { Metadata } from "next";

export const metadata: Metadata = { title: PAGE_TITLES.STORY_DETAIL };

export default function Page() {
  return <StoryDetailView />;
}

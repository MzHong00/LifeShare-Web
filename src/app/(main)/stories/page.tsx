import { StoryBoardView } from "@/features/stories/components/StoryBoardView";
import { PAGE_TITLES } from "@/constants/seo";

import type { Metadata } from "next";

export const metadata: Metadata = { title: PAGE_TITLES.STORIES };

export default function Page() {
  return <StoryBoardView />;
}

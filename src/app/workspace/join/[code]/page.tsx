import { WorkspaceJoinView } from "@/features/workspace/components/WorkspaceJoinView";
import { PAGE_TITLES } from "@/constants/seo";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: PAGE_TITLES.WORKSPACE_JOIN,
  description: "초대받은 워크스페이스에 참여해보세요.",
};

export default function Page() {
  return <WorkspaceJoinView />;
}

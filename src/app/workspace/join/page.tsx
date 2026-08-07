import { WorkspaceCodeJoinView } from "@/features/workspace/components/WorkspaceCodeJoinView";
import { PAGE_TITLES } from "@/constants/seo";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: PAGE_TITLES.WORKSPACE_CODE_JOIN,
  description: "전달받은 초대 코드를 입력해 라이프룸에 참여해보세요.",
};

export default function Page() {
  return <WorkspaceCodeJoinView />;
}

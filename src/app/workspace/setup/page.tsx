import { Suspense } from "react";
import { WorkspaceSetupView } from "@/features/workspace/components/WorkspaceSetupView";
import { PAGE_TITLES } from "@/constants/seo";

import type { Metadata } from "next";

export const metadata: Metadata = { title: PAGE_TITLES.WORKSPACE_SETUP };

export default function Page() {
  return (
    <Suspense>
      <WorkspaceSetupView />
    </Suspense>
  );
}

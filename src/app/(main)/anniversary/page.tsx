import { AnniversaryView } from "@/features/anniversary/components/AnniversaryView";
import { PAGE_TITLES } from "@/constants/seo";

import type { Metadata } from "next";

export const metadata: Metadata = { title: PAGE_TITLES.ANNIVERSARY };

export default function Page() {
  return <AnniversaryView />;
}

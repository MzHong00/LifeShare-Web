import { MapView } from "@/features/map/components/MapView";
import { PAGE_TITLES } from "@/constants/seo";

import type { Metadata } from "next";

export const metadata: Metadata = { title: PAGE_TITLES.MAP };

export default function Page() {
  return <MapView />;
}

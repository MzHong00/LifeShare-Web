import { Suspense } from "react";

import { TodoView } from "@/features/todo/components/TodoView";
import { PAGE_TITLES } from "@/constants/seo";

import type { Metadata } from "next";

export const metadata: Metadata = { title: PAGE_TITLES.TODO };

export default function Page() {
  return (
    <Suspense>
      <TodoView />
    </Suspense>
  );
}

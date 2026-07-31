import { Suspense } from "react";
import { TodoCreateView } from "@/features/todo/components/TodoCreateView";
import { PAGE_TITLES } from "@/constants/seo";

import type { Metadata } from "next";

export const metadata: Metadata = { title: PAGE_TITLES.TODO_CREATE };

export default function Page() {
  return (
    <Suspense>
      <TodoCreateView />
    </Suspense>
  );
}

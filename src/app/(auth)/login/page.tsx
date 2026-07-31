import { Suspense } from "react";

import { LoginView } from "@/features/auth/components/LoginView";
import { INDEXABLE_ROBOTS, PAGE_TITLES } from "@/constants/seo";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: PAGE_TITLES.LOGIN,
  description: "듀어스에 로그인하고 소중한 일상을 함께 나눠보세요.",
  robots: INDEXABLE_ROBOTS,
};

export default function Page() {
  return (
    <Suspense>
      <LoginView />
    </Suspense>
  );
}

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";

export default function RootPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    } else if (!currentWorkspace) {
      router.replace("/workspace/landing");
    } else {
      router.replace("/home");
    }
  }, [isAuthenticated, currentWorkspace, router]);

  return null;
}

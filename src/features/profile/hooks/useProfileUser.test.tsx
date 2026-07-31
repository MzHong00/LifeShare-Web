import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { authQueries } from "@/features/auth/queries/authQueries";
import { FALLBACK_EMAIL, FALLBACK_NAME } from "@/features/profile/constants/profile";
import { useProfileUser } from "./useProfileUser";

import type { User } from "@/types/user";
import type { ReactNode } from "react";

vi.mock("@/features/auth/queries/authQueries", () => ({
  authQueries: { user: vi.fn(() => ({ queryKey: ["auth", "user"] })) },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { Wrapper, queryClient };
};

describe("useProfileUser", () => {
  it("user에 name이 있으면 그대로 표시 이름으로 사용한다", () => {
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData<User>(authQueries.user().queryKey, {
      id: "1",
      name: "홍길동",
      email: "hong@example.com",
    });

    const { result } = renderHook(() => useProfileUser(), { wrapper: Wrapper });

    expect(result.current.displayName).toBe("홍길동");
    expect(result.current.email).toBe("hong@example.com");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("name이 없으면 이메일 앞부분을 표시 이름으로 사용한다", () => {
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData<User>(authQueries.user().queryKey, {
      id: "1",
      name: "",
      email: "hong@example.com",
    });

    const { result } = renderHook(() => useProfileUser(), { wrapper: Wrapper });

    expect(result.current.displayName).toBe("hong");
  });

  it("로딩 중에는 폴백값을 노출하지 않는다", () => {
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useProfileUser(), { wrapper: Wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.email).toBe("");
    expect(result.current.displayName).toBe("");
  });

  it("user가 없고 로딩도 아니면 폴백값을 사용한다", () => {
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(authQueries.user().queryKey, null);

    const { result } = renderHook(() => useProfileUser(), { wrapper: Wrapper });

    expect(result.current.email).toBe(FALLBACK_EMAIL);
    expect(result.current.displayName).toBe(FALLBACK_NAME);
  });
});

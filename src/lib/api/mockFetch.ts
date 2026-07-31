import { vi } from "vitest";

/** fetch가 주어진 상태·본문으로 1회 응답하도록 mock한다 (BFF api 테스트 공용) */
export const mockFetch = (status: number, body: unknown) => {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
  return vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(response);
};

import { describe, expect, it, vi } from "vitest";

import { buildInviteLink } from "@/features/workspace/utils/workspaceUtils";

describe("buildInviteLink", () => {
  it("현재 origin과 초대 코드로 참여 링크를 만든다", () => {
    vi.stubGlobal("location", { origin: "https://duous.app" });

    expect(buildInviteLink("ABC123")).toBe("https://duous.app/workspace/join/ABC123");

    vi.unstubAllGlobals();
  });
});

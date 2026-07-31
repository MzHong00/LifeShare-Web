import { describe, expect, it } from "vitest";

import { sortWithMainFirst } from "./ProfileWorkspaceSection";

import type { Workspace } from "@/features/workspace/types/workspace";

const buildWorkspace = (id: string): Workspace => ({
  id,
  name: id,
  type: "couple",
  themeColor: "pink",
});

describe("sortWithMainFirst", () => {
  it("메인 워크스페이스를 맨 위로 고정하고 나머지는 원래 순서를 유지한다", () => {
    const workspaces = [buildWorkspace("a"), buildWorkspace("b"), buildWorkspace("c")];

    const result = sortWithMainFirst(workspaces, "b");

    expect(result.map((ws) => ws.id)).toEqual(["b", "a", "c"]);
  });

  it("메인 워크스페이스가 없으면 원래 순서를 그대로 유지한다", () => {
    const workspaces = [buildWorkspace("a"), buildWorkspace("b")];

    const result = sortWithMainFirst(workspaces, undefined);

    expect(result.map((ws) => ws.id)).toEqual(["a", "b"]);
  });
});

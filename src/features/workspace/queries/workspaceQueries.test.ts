import { describe, expect, it, vi, beforeEach } from "vitest";

import { workspacesApi } from "@/features/workspace/api/workspaces";
import { workspaceQueries } from "@/features/workspace/queries/workspaceQueries";

import type { Workspace, WorkspaceInvitePreview } from "@/features/workspace/types/workspace";

vi.mock("@/features/workspace/api/workspaces", () => ({
  workspacesApi: {
    listMine: vi.fn(),
    getInviteCode: vi.fn(),
    getInvitePreview: vi.fn(),
  },
}));

const WORKSPACE_ID = "ws-1"; // 테스트용 워크스페이스 ID
const INVITE_CODE = "K7M2P9QX"; // 테스트용 초대 코드

beforeEach(() => {
  vi.clearAllMocks();
});

describe("workspaceQueries.keys", () => {
  it("모든 하위 키가 all을 접두사로 공유해 범위 무효화가 가능하다", () => {
    const { keys } = workspaceQueries;
    const root = keys.all;

    [keys.mine(), keys.inviteCodes(), keys.inviteCode(WORKSPACE_ID), keys.byInviteCode(INVITE_CODE)]
      .map((key) => key.slice(0, root.length))
      .forEach((prefix) => expect(prefix).toEqual([...root]));
  });

  it("inviteCode는 inviteCodes 하위에 workspaceId를 붙인 키를 만든다", () => {
    const { keys } = workspaceQueries;

    expect(keys.inviteCode(WORKSPACE_ID)).toEqual([...keys.inviteCodes(), WORKSPACE_ID]);
  });

  it("같은 workspaceId·code면 동일한 queryKey를 반환한다", () => {
    expect(workspaceQueries.inviteCode(WORKSPACE_ID).queryKey).toEqual(
      workspaceQueries.inviteCode(WORKSPACE_ID).queryKey
    );
    expect(workspaceQueries.byInviteCode(INVITE_CODE).queryKey).toEqual(
      workspaceQueries.byInviteCode(INVITE_CODE).queryKey
    );
  });

  it("다른 workspaceId·code면 서로 다른 queryKey를 반환한다", () => {
    expect(workspaceQueries.inviteCode("ws-1").queryKey).not.toEqual(
      workspaceQueries.inviteCode("ws-2").queryKey
    );
    expect(workspaceQueries.byInviteCode("AAAA").queryKey).not.toEqual(
      workspaceQueries.byInviteCode("BBBB").queryKey
    );
  });
});

describe("workspaceQueries.mine", () => {
  it("staleTime이 설정돼 있다", () => {
    expect(workspaceQueries.mine().staleTime).toBeGreaterThan(0);
  });

  it("queryFn이 workspacesApi.listMine을 호출한다", async () => {
    const workspaces = [{ id: WORKSPACE_ID }] as unknown as Workspace[];
    vi.mocked(workspacesApi.listMine).mockResolvedValue(workspaces);

    const options = workspaceQueries.mine();
    const result = await options.queryFn!(
      {} as unknown as Parameters<NonNullable<typeof options.queryFn>>[0]
    );

    expect(workspacesApi.listMine).toHaveBeenCalledTimes(1);
    expect(result).toBe(workspaces);
  });
});

describe("workspaceQueries.inviteCode", () => {
  it("workspaceId가 빈 문자열이면 enabled가 false다", () => {
    expect(workspaceQueries.inviteCode("").enabled).toBe(false);
    expect(workspaceQueries.inviteCode(WORKSPACE_ID).enabled).toBe(true);
  });

  it("queryFn이 workspacesApi.getInviteCode에 workspaceId를 전달한다", async () => {
    vi.mocked(workspacesApi.getInviteCode).mockResolvedValue(INVITE_CODE);

    const options = workspaceQueries.inviteCode(WORKSPACE_ID);
    const result = await options.queryFn!(
      {} as unknown as Parameters<NonNullable<typeof options.queryFn>>[0]
    );

    expect(workspacesApi.getInviteCode).toHaveBeenCalledWith(WORKSPACE_ID);
    expect(result).toBe(INVITE_CODE);
  });
});

describe("workspaceQueries.byInviteCode", () => {
  it("code가 빈 문자열이면 enabled가 false다", () => {
    expect(workspaceQueries.byInviteCode("").enabled).toBe(false);
    expect(workspaceQueries.byInviteCode(INVITE_CODE).enabled).toBe(true);
  });

  it("잘못된 코드 재시도가 무의미하므로 retry가 false다", () => {
    expect(workspaceQueries.byInviteCode(INVITE_CODE).retry).toBe(false);
  });

  it("queryFn이 workspacesApi.getInvitePreview에 code를 전달한다", async () => {
    const preview = {
      id: WORKSPACE_ID,
      name: "우리집",
      type: "couple",
      memberCount: 2,
    } as unknown as WorkspaceInvitePreview;
    vi.mocked(workspacesApi.getInvitePreview).mockResolvedValue(preview);

    const options = workspaceQueries.byInviteCode(INVITE_CODE);
    const result = await options.queryFn!(
      {} as unknown as Parameters<NonNullable<typeof options.queryFn>>[0]
    );

    expect(workspacesApi.getInvitePreview).toHaveBeenCalledWith(INVITE_CODE);
    expect(result).toBe(preview);
  });
});

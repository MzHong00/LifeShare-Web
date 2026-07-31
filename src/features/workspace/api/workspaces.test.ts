import { afterEach, describe, expect, it, vi } from "vitest";

import { workspacesApi } from "@/features/workspace/api/workspaces";

import { mockFetch } from "@/lib/api/mockFetch";

import type { Workspace } from "@/features/workspace/types/workspace";

const workspace = {
  id: "workspace-1",
  name: "우리집",
  type: "couple",
  startDate: "2026-01-01",
  themeColor: "pink",
  members: [
    {
      id: "user-1",
      name: "홍길동",
      email: "test@example.com",
      profileImage: "https://example.com/avatar.png",
    },
  ],
} as unknown as Workspace;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("workspacesApi.listMine", () => {
  it("GET /api/workspaces를 호출해 내 워크스페이스 목록을 반환한다", async () => {
    const fetchSpy = mockFetch(200, [workspace]);

    const result = await workspacesApi.listMine();

    expect(fetchSpy).toHaveBeenCalledWith("/api/workspaces", expect.any(Object));
    expect(result).toEqual([workspace]);
  });

  it("조회 실패 시 에러를 throw한다", async () => {
    mockFetch(500, { message: "워크스페이스 목록 조회에 실패했습니다." });

    await expect(workspacesApi.listMine()).rejects.toThrow(
      "워크스페이스 목록 조회에 실패했습니다."
    );
  });
});

describe("workspacesApi.create", () => {
  it("POST /api/workspaces로 생성 요청을 보내고 workspace를 반환한다", async () => {
    const fetchSpy = mockFetch(201, { workspace });

    const result = await workspacesApi.create("우리집", "couple", "2026-01-01");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/workspaces",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "우리집", type: "couple", startDate: "2026-01-01" }),
      })
    );
    expect(result.workspace).toEqual(workspace);
  });

  it("생성 실패 시 에러를 throw한다", async () => {
    mockFetch(500, { message: "워크스페이스 생성에 실패했습니다." });

    await expect(workspacesApi.create("우리집", "couple", undefined)).rejects.toThrow(
      "워크스페이스 생성에 실패했습니다."
    );
  });
});

describe("workspacesApi.getByInviteCode", () => {
  it("GET /api/workspace-invites/[code]로 조회하고 워크스페이스를 반환한다", async () => {
    const fetchSpy = mockFetch(200, workspace);

    const result = await workspacesApi.getByInviteCode("abcd1234");

    expect(fetchSpy).toHaveBeenCalledWith("/api/workspace-invites/abcd1234", expect.any(Object));
    expect(result).toEqual(workspace);
  });

  it("만료·미존재 코드는 null을 반환한다", async () => {
    mockFetch(200, null);

    const result = await workspacesApi.getByInviteCode("expired1");

    expect(result).toBeNull();
  });
});

describe("workspacesApi.join", () => {
  it("POST /api/workspaces/[id]/join으로 참여 요청을 보내고 워크스페이스를 반환한다", async () => {
    const fetchSpy = mockFetch(200, workspace);

    const result = await workspacesApi.join("workspace-1");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/workspaces/workspace-1/join",
      expect.objectContaining({ method: "POST" })
    );
    expect(result).toEqual(workspace);
  });

  it("참여 실패 시 에러를 throw한다", async () => {
    mockFetch(500, { message: "워크스페이스 참여에 실패했습니다." });

    await expect(workspacesApi.join("workspace-1")).rejects.toThrow(
      "워크스페이스 참여에 실패했습니다."
    );
  });
});

describe("workspacesApi.updateName / updateStartDate / updateThemeColor", () => {
  it("PATCH /api/workspaces/[id]로 이름을 수정한다", async () => {
    const fetchSpy = mockFetch(204, null);

    await workspacesApi.updateName("workspace-1", "새 이름");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/workspaces/workspace-1",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ name: "새 이름" }) })
    );
  });

  it("PATCH /api/workspaces/[id]로 시작일을 수정한다", async () => {
    const fetchSpy = mockFetch(204, null);

    await workspacesApi.updateStartDate("workspace-1", "2026-02-01");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/workspaces/workspace-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ startDate: "2026-02-01" }),
      })
    );
  });

  it("PATCH /api/workspaces/[id]로 테마 색상을 수정한다", async () => {
    const fetchSpy = mockFetch(204, null);

    await workspacesApi.updateThemeColor("workspace-1", "blue");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/workspaces/workspace-1",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ themeColor: "blue" }) })
    );
  });

  it("수정 실패 시 에러를 throw한다", async () => {
    mockFetch(500, { message: "워크스페이스 이름 수정에 실패했습니다." });

    await expect(workspacesApi.updateName("workspace-1", "새 이름")).rejects.toThrow(
      "워크스페이스 이름 수정에 실패했습니다."
    );
  });
});

describe("workspacesApi.createInviteCode", () => {
  it("POST /api/workspaces/[id]/invites로 초대 코드를 생성해 반환한다", async () => {
    const fetchSpy = mockFetch(201, { code: "abcd1234" });

    const result = await workspacesApi.createInviteCode("workspace-1");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/workspaces/workspace-1/invites",
      expect.objectContaining({ method: "POST" })
    );
    expect(result).toBe("abcd1234");
  });

  it("생성 실패 시 에러를 throw한다", async () => {
    mockFetch(500, { message: "초대 코드 생성에 실패했습니다." });

    await expect(workspacesApi.createInviteCode("workspace-1")).rejects.toThrow(
      "초대 코드 생성에 실패했습니다."
    );
  });
});

describe("workspacesApi.leave", () => {
  it("DELETE /api/workspaces/[id]/members/[userId]로 나가기 요청을 보낸다", async () => {
    const fetchSpy = mockFetch(204, null);

    await workspacesApi.leave("workspace-1", "user-1");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/workspaces/workspace-1/members/user-1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("나가기 실패 시 에러를 throw한다", async () => {
    mockFetch(500, { message: "워크스페이스 나가기에 실패했습니다." });

    await expect(workspacesApi.leave("workspace-1", "user-1")).rejects.toThrow(
      "워크스페이스 나가기에 실패했습니다."
    );
  });
});

describe("workspacesApi.updateMember", () => {
  it("PATCH /api/workspaces/[id]/members/[userId]로 멤버 프로필을 수정한다", async () => {
    const fetchSpy = mockFetch(204, null);

    await workspacesApi.updateMember("workspace-1", "user-1", { displayName: "새 이름" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/workspaces/workspace-1/members/user-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ displayName: "새 이름" }),
      })
    );
  });

  it("수정 실패 시 에러를 throw한다", async () => {
    mockFetch(500, { message: "멤버 프로필 수정에 실패했습니다." });

    await expect(
      workspacesApi.updateMember("workspace-1", "user-1", { displayName: "새 이름" })
    ).rejects.toThrow("멤버 프로필 수정에 실패했습니다.");
  });
});

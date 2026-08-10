import { describe, expect, it, vi } from "vitest";

import { workspaceRepository } from "@/server/domain/workspace/repository";

import type { SupabaseClient, PostgrestError } from "@supabase/supabase-js";

// 가짜 쿼리 빌더가 최종적으로 resolve할 결과 (Supabase 응답 모양)
interface QueryResult {
  data?: unknown;
  error?: PostgrestError | null;
  count?: number | null;
}

// 빌더에 기록된 체이닝 호출 한 건
interface QueryCall {
  method: string;
  args: unknown[];
}

interface QueryBuilder {
  calls: QueryCall[];
  then: (resolve: (value: QueryResult) => unknown) => Promise<unknown>;
  [method: string]: unknown;
}

const CHAIN_METHODS = [
  "select",
  "eq",
  "in",
  "insert",
  "update",
  "upsert",
  "delete",
  "single",
  "maybeSingle",
] as const;

const ERROR_FIELDS = {
  name: "PostgrestError",
  message: "조회 실패",
  details: "",
  hint: "",
  code: "PGRST000",
};
const ERROR: PostgrestError = { ...ERROR_FIELDS, toJSON: () => ERROR_FIELDS };

/** `.from().select().eq()...` 체이닝을 흉내내는 thenable 빌더를 만든다 (호출 인자를 전부 기록) */
const createQueryBuilder = (result: QueryResult): QueryBuilder => {
  const calls: QueryCall[] = [];
  const builder = {
    calls,
    then: (resolve: (value: QueryResult) => unknown) => Promise.resolve(result).then(resolve),
  } as QueryBuilder;

  CHAIN_METHODS.forEach((method) => {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  });
  return builder;
};

/**
 * 가짜 Supabase 클라이언트를 만든다.
 * 테이블별 결과는 배열로 주면 호출 순서대로 소비되고, 소진 후에는 마지막 결과를 재사용한다.
 */
const createSupabase = (
  tables: Record<string, QueryResult | QueryResult[]> = {},
  rpcResult: QueryResult = { data: null, error: null }
) => {
  const queues: Record<string, QueryResult[]> = {};
  Object.entries(tables).forEach(([table, result]) => {
    queues[table] = Array.isArray(result) ? [...result] : [result];
  });

  const builders: Record<string, QueryBuilder[]> = {}; // 테이블별로 생성된 빌더 (호출 검증용)
  const fromOrder: string[] = []; // from()이 호출된 테이블 순서

  const from = vi.fn((table: string) => {
    const queue = queues[table] ?? [{ data: null, error: null }];
    const result = queue.length > 1 ? (queue.shift() as QueryResult) : queue[0];
    const builder = createQueryBuilder(result);
    builders[table] = [...(builders[table] ?? []), builder];
    fromOrder.push(table);
    return builder;
  });
  const rpc = vi.fn(() => Promise.resolve(rpcResult));

  return {
    supabase: { from, rpc } as unknown as SupabaseClient,
    from,
    rpc,
    builders,
    fromOrder,
  };
};

/** 특정 테이블의 n번째 빌더에 기록된 체이닝 호출을 꺼낸다 */
const callsOf = (builders: Record<string, QueryBuilder[]>, table: string, index = 0): QueryCall[] =>
  builders[table][index].calls;

describe("workspaceRepository.findById", () => {
  it("워크스페이스와 멤버를 병렬 조회해 members를 합쳐 반환한다", async () => {
    const members = [{ id: "user-1", name: "홍길동", email: "a@b.c", role: "owner" }];
    const { supabase, builders } = createSupabase({
      workspaces: { data: { id: "workspace-1", name: "우리집" }, error: null },
      workspace_members: { data: members, error: null },
    });

    const result = await workspaceRepository.findById(supabase, "workspace-1");

    expect(result).toEqual({
      data: { id: "workspace-1", name: "우리집", members },
      error: null,
    });
    expect(callsOf(builders, "workspaces")).toEqual([
      { method: "select", args: [expect.stringContaining("start_date")] },
      { method: "eq", args: ["id", "workspace-1"] },
      { method: "single", args: [] },
    ]);
    expect(callsOf(builders, "workspace_members")).toEqual([
      { method: "select", args: [expect.stringContaining("avatar_url")] },
      { method: "eq", args: ["workspace_id", "workspace-1"] },
    ]);
  });

  it("멤버가 없으면 빈 배열을 members로 채운다", async () => {
    const { supabase } = createSupabase({
      workspaces: { data: { id: "workspace-1" }, error: null },
      workspace_members: { data: null, error: null },
    });

    const result = await workspaceRepository.findById(supabase, "workspace-1");

    expect(result.data?.members).toEqual([]);
  });

  it("조회 에러가 나면 data는 null이고 에러를 그대로 반환한다", async () => {
    const { supabase } = createSupabase({
      workspaces: { data: null, error: ERROR },
    });

    const result = await workspaceRepository.findById(supabase, "workspace-1");

    expect(result).toEqual({ data: null, error: ERROR });
  });

  it("워크스페이스가 없으면 null을 반환한다", async () => {
    const { supabase } = createSupabase({
      workspaces: { data: null, error: null },
    });

    const result = await workspaceRepository.findById(supabase, "workspace-1");

    expect(result).toEqual({ data: null, error: null });
  });
});

describe("workspaceRepository.findManyByUserId", () => {
  it("멤버십이 없으면 워크스페이스를 조회하지 않고 빈 배열을 반환한다", async () => {
    const { supabase, from } = createSupabase({
      workspace_members: { data: [], error: null },
    });

    const result = await workspaceRepository.findManyByUserId(supabase, "user-1");

    expect(result).toEqual({ data: [], error: null });
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("workspace_members");
  });

  it("멤버십 조회 에러 시 빈 배열과 에러를 반환한다", async () => {
    const { supabase } = createSupabase({
      workspace_members: { data: null, error: ERROR },
    });

    const result = await workspaceRepository.findManyByUserId(supabase, "user-1");

    expect(result).toEqual({ data: [], error: ERROR });
  });

  it("workspace_id 기준으로 멤버를 각 워크스페이스에 매칭해 넣는다", async () => {
    const memberA = {
      workspace_id: "workspace-1",
      id: "user-1",
      name: "홍길동",
      email: "a@b.c",
      role: "owner",
    };
    const memberB = {
      workspace_id: "workspace-2",
      id: "user-1",
      name: "홍길동",
      email: "a@b.c",
      role: "member",
    };
    const { supabase, builders } = createSupabase({
      workspace_members: [
        { data: [{ workspace_id: "workspace-1" }, { workspace_id: "workspace-2" }], error: null },
        { data: [memberA, memberB], error: null },
      ],
      workspaces: {
        data: [{ id: "workspace-1" }, { id: "workspace-2" }],
        error: null,
      },
    });

    const result = await workspaceRepository.findManyByUserId(supabase, "user-1");

    expect(result).toEqual({
      data: [
        { id: "workspace-1", members: [memberA] },
        { id: "workspace-2", members: [memberB] },
      ],
      error: null,
    });
    expect(callsOf(builders, "workspaces")).toEqual([
      { method: "select", args: [expect.any(String)] },
      { method: "in", args: ["id", ["workspace-1", "workspace-2"]] },
    ]);
    expect(callsOf(builders, "workspace_members", 1)).toEqual([
      { method: "select", args: [expect.stringContaining("workspace_id")] },
      { method: "in", args: ["workspace_id", ["workspace-1", "workspace-2"]] },
    ]);
  });

  it("워크스페이스 조회 에러 시 빈 배열과 에러를 반환한다", async () => {
    const { supabase } = createSupabase({
      workspace_members: [{ data: [{ workspace_id: "workspace-1" }], error: null }, { data: [] }],
      workspaces: { data: null, error: ERROR },
    });

    const result = await workspaceRepository.findManyByUserId(supabase, "user-1");

    expect(result).toEqual({ data: [], error: ERROR });
  });

  it("멤버 목록 조회 에러 시 빈 배열과 에러를 반환한다", async () => {
    const { supabase } = createSupabase({
      workspace_members: [
        { data: [{ workspace_id: "workspace-1" }], error: null },
        { data: null, error: ERROR },
      ],
      workspaces: { data: [{ id: "workspace-1" }], error: null },
    });

    const result = await workspaceRepository.findManyByUserId(supabase, "user-1");

    expect(result).toEqual({ data: [], error: ERROR });
  });
});

describe("workspaceRepository.findMemberRole", () => {
  it("멤버면 role을 반환한다", async () => {
    const { supabase, builders } = createSupabase({
      workspace_members: { data: { role: "owner" }, error: null },
    });

    const result = await workspaceRepository.findMemberRole(supabase, "workspace-1", "user-1");

    expect(result).toBe("owner");
    expect(callsOf(builders, "workspace_members")).toEqual([
      { method: "select", args: ["role"] },
      { method: "eq", args: ["workspace_id", "workspace-1"] },
      { method: "eq", args: ["user_id", "user-1"] },
      { method: "maybeSingle", args: [] },
    ]);
  });

  it("멤버가 아니면 null을 반환한다", async () => {
    const { supabase } = createSupabase({
      workspace_members: { data: null, error: null },
    });

    const result = await workspaceRepository.findMemberRole(supabase, "workspace-1", "user-1");

    expect(result).toBeNull();
  });
});

describe("workspaceRepository.findInviteByWorkspaceId", () => {
  it("초대 코드가 있으면 코드를 반환한다", async () => {
    const { supabase, from, builders } = createSupabase({
      workspace_invites: { data: { invite_code: "K7M2P9QX" }, error: null },
    });

    const result = await workspaceRepository.findInviteByWorkspaceId(supabase, "workspace-1");

    expect(result).toBe("K7M2P9QX");
    expect(from).toHaveBeenCalledWith("workspace_invites");
    expect(callsOf(builders, "workspace_invites")).toEqual([
      { method: "select", args: ["invite_code"] },
      { method: "eq", args: ["workspace_id", "workspace-1"] },
      { method: "maybeSingle", args: [] },
    ]);
  });

  it("초대 코드가 없으면 null을 반환한다", async () => {
    const { supabase } = createSupabase({
      workspace_invites: { data: null, error: null },
    });

    const result = await workspaceRepository.findInviteByWorkspaceId(supabase, "workspace-1");

    expect(result).toBeNull();
  });
});

describe("workspaceRepository.upsertInvite", () => {
  it("workspace_id를 onConflict로 지정해 upsert한다", async () => {
    const { supabase, from, builders } = createSupabase({
      workspace_invites: { data: null, error: null },
    });

    await workspaceRepository.upsertInvite(supabase, "workspace-1", "K7M2P9QX", "user-1");

    expect(from).toHaveBeenCalledWith("workspace_invites");
    expect(callsOf(builders, "workspace_invites")).toEqual([
      {
        method: "upsert",
        args: [
          {
            workspace_id: "workspace-1",
            invite_code: "K7M2P9QX",
            created_by: "user-1",
            expires_at: null,
          },
          { onConflict: "workspace_id" },
        ],
      },
    ]);
  });
});

describe("workspaceRepository.findInvitePreviewByCode", () => {
  it("rpc를 호출해 snake_case를 camelCase로 변환하고 member_count를 숫자로 만든다", async () => {
    const { supabase, rpc } = createSupabase(
      {},
      {
        data: [{ id: "workspace-1", name: "우리집", type: "couple", member_count: "2" }],
        error: null,
      }
    );

    const result = await workspaceRepository.findInvitePreviewByCode(supabase, "K7M2P9QX");

    expect(rpc).toHaveBeenCalledWith("get_invite_preview", { code: "K7M2P9QX" });
    expect(result).toEqual({ id: "workspace-1", name: "우리집", type: "couple", memberCount: 2 });
  });

  it("rpc 에러 시 null을 반환한다", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { supabase } = createSupabase({}, { data: null, error: ERROR });

    const result = await workspaceRepository.findInvitePreviewByCode(supabase, "K7M2P9QX");

    expect(result).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("결과가 비어 있으면 null을 반환한다", async () => {
    const { supabase } = createSupabase({}, { data: [], error: null });

    const result = await workspaceRepository.findInvitePreviewByCode(supabase, "K7M2P9QX");

    expect(result).toBeNull();
  });
});

describe("workspaceRepository.joinByInviteCode", () => {
  it("rpc에 코드와 멤버 정보를 넘기고 workspaceId를 반환한다", async () => {
    const { supabase, rpc } = createSupabase({}, { data: "workspace-1", error: null });

    const result = await workspaceRepository.joinByInviteCode(supabase, "K7M2P9QX", {
      name: "홍길동",
      email: "a@b.c",
      avatarUrl: "https://example.com/a.png",
    });

    expect(rpc).toHaveBeenCalledWith("join_workspace_with_code", {
      code: "K7M2P9QX",
      display_name: "홍길동",
      member_email: "a@b.c",
      avatar_url: "https://example.com/a.png",
    });
    expect(result).toEqual({ workspaceId: "workspace-1", error: null });
  });

  it("멤버 정보가 없으면 null로 채워 넘기고 실패 시 workspaceId는 null이다", async () => {
    const { supabase, rpc } = createSupabase({}, { data: null, error: ERROR });

    const result = await workspaceRepository.joinByInviteCode(supabase, "K7M2P9QX", {});

    expect(rpc).toHaveBeenCalledWith("join_workspace_with_code", {
      code: "K7M2P9QX",
      display_name: null,
      member_email: null,
      avatar_url: null,
    });
    expect(result).toEqual({ workspaceId: null, error: ERROR });
  });
});

describe("workspaceRepository.transferOwnership", () => {
  it("rpc에 워크스페이스 id를 넘겨 방장을 넘긴다", async () => {
    const { supabase, rpc } = createSupabase({}, { data: null, error: null });

    const result = await workspaceRepository.transferOwnership(supabase, "workspace-1");

    expect(rpc).toHaveBeenCalledWith("transfer_workspace_ownership", {
      target_workspace_id: "workspace-1",
    });
    expect(result).toBeNull();
  });

  it("rpc 에러를 그대로 반환한다", async () => {
    const { supabase } = createSupabase({}, { data: null, error: ERROR });

    const result = await workspaceRepository.transferOwnership(supabase, "workspace-1");

    expect(result).toBe(ERROR);
  });
});

describe("workspaceRepository.deleteById", () => {
  it("콘텐츠 테이블 → workspaces → members 순서로 지우고 재조회로 삭제를 확인한다", async () => {
    const { supabase, fromOrder, builders } = createSupabase({
      workspaces: [
        { data: null, error: null }, // delete
        { data: null, error: null }, // 재조회 (남은 row 없음)
      ],
    });

    const result = await workspaceRepository.deleteById(supabase, "workspace-1");

    expect(result).toEqual({ isDeleted: true, error: null });
    expect(fromOrder).toEqual([
      "messages",
      "todos",
      "stories",
      "calendar_events",
      "workspace_invites",
      "workspaces",
      "workspaces",
      "workspace_members",
    ]);
    expect(callsOf(builders, "messages")).toEqual([
      { method: "delete", args: [] },
      { method: "eq", args: ["workspace_id", "workspace-1"] },
    ]);
    expect(callsOf(builders, "workspaces", 1)).toEqual([
      { method: "select", args: ["id"] },
      { method: "eq", args: ["id", "workspace-1"] },
      { method: "maybeSingle", args: [] },
    ]);
    expect(callsOf(builders, "workspace_members")).toEqual([
      { method: "delete", args: [] },
      { method: "eq", args: ["workspace_id", "workspace-1"] },
    ]);
  });

  it("콘텐츠 테이블 삭제가 실패하면 즉시 중단한다", async () => {
    const { supabase, fromOrder } = createSupabase({
      messages: { data: null, error: ERROR },
    });

    const result = await workspaceRepository.deleteById(supabase, "workspace-1");

    expect(result).toEqual({ isDeleted: false, error: ERROR });
    expect(fromOrder).toEqual(["messages"]);
  });

  it("워크스페이스 삭제가 실패하면 멤버를 지우지 않는다", async () => {
    const { supabase, fromOrder } = createSupabase({
      workspaces: { data: null, error: ERROR },
    });

    const result = await workspaceRepository.deleteById(supabase, "workspace-1");

    expect(result).toEqual({ isDeleted: false, error: ERROR });
    expect(fromOrder).not.toContain("workspace_members");
  });

  it("재조회가 실패하면 isDeleted는 false다", async () => {
    const { supabase } = createSupabase({
      workspaces: [
        { data: null, error: null },
        { data: null, error: ERROR },
      ],
    });

    const result = await workspaceRepository.deleteById(supabase, "workspace-1");

    expect(result).toEqual({ isDeleted: false, error: ERROR });
  });

  it("재조회에 워크스페이스가 남아 있으면 isDeleted는 false다", async () => {
    const { supabase, fromOrder } = createSupabase({
      workspaces: [
        { data: null, error: null },
        { data: { id: "workspace-1" }, error: null },
      ],
    });

    const result = await workspaceRepository.deleteById(supabase, "workspace-1");

    expect(result).toEqual({ isDeleted: false, error: null });
    expect(fromOrder).not.toContain("workspace_members");
  });
});

describe("workspaceRepository.insertMember", () => {
  it("role을 지정하면 insert 값에 포함한다", async () => {
    const { supabase, builders } = createSupabase({
      workspace_members: { data: null, error: null },
    });

    await workspaceRepository.insertMember(supabase, "workspace-1", {
      userId: "user-1",
      name: "홍길동",
      email: "a@b.c",
      avatarUrl: "https://example.com/a.png",
      role: "owner",
    });

    expect(callsOf(builders, "workspace_members")).toEqual([
      {
        method: "insert",
        args: [
          {
            workspace_id: "workspace-1",
            user_id: "user-1",
            display_name: "홍길동",
            email: "a@b.c",
            avatar_url: "https://example.com/a.png",
            role: "owner",
          },
        ],
      },
    ]);
  });

  it("role을 지정하지 않으면 insert 값에서 생략한다", async () => {
    const { supabase, builders } = createSupabase({
      workspace_members: { data: null, error: null },
    });

    await workspaceRepository.insertMember(supabase, "workspace-1", { userId: "user-1" });

    expect(callsOf(builders, "workspace_members")[0].args[0]).not.toHaveProperty("role");
  });
});

describe("workspaceRepository.countMembers", () => {
  it("head 옵션으로 멤버 수만 세어 반환한다", async () => {
    const { supabase, builders } = createSupabase({
      workspace_members: { count: 2, error: null },
    });

    const result = await workspaceRepository.countMembers(supabase, "workspace-1");

    expect(result).toEqual({ count: 2, error: null });
    expect(callsOf(builders, "workspace_members")).toEqual([
      { method: "select", args: ["user_id", { count: "exact", head: true }] },
      { method: "eq", args: ["workspace_id", "workspace-1"] },
    ]);
  });
});

describe("workspaceRepository.updateMemberProfile", () => {
  it("전달된 필드만 update하고 user_id로 대상을 제한한다", async () => {
    const { supabase, builders } = createSupabase({
      workspace_members: { data: null, error: null },
    });

    await workspaceRepository.updateMemberProfile(supabase, "user-1", {
      name: "새 이름",
      avatarUrl: "https://example.com/new.png",
    });

    expect(callsOf(builders, "workspace_members")).toEqual([
      {
        method: "update",
        args: [{ display_name: "새 이름", avatar_url: "https://example.com/new.png" }],
      },
      { method: "eq", args: ["user_id", "user-1"] },
    ]);
  });

  it("미지정 필드는 update 값에서 생략한다", async () => {
    const { supabase, builders } = createSupabase({
      workspace_members: { data: null, error: null },
    });

    await workspaceRepository.updateMemberProfile(supabase, "user-1", { name: "새 이름" });

    expect(callsOf(builders, "workspace_members")[0].args[0]).toEqual({ display_name: "새 이름" });
  });
});

describe("workspaceRepository.create", () => {
  it("startDate가 없으면 null로 넣어 생성한다", async () => {
    const { supabase, builders } = createSupabase({
      workspaces: { data: { id: "workspace-1" }, error: null },
    });

    await workspaceRepository.create(supabase, {
      name: "우리집",
      type: "couple",
      createdBy: "user-1",
    });

    expect(callsOf(builders, "workspaces")).toEqual([
      {
        method: "insert",
        args: [{ name: "우리집", type: "couple", start_date: null, created_by: "user-1" }],
      },
      { method: "select", args: [expect.any(String)] },
      { method: "single", args: [] },
    ]);
  });
});

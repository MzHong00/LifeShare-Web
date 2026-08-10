import { beforeEach, describe, expect, it, vi } from "vitest";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";
import { storyRepository } from "@/server/domain/story/repository";

import { GET, POST } from "./route";

import type { NextRequest } from "next/server";
import type { PostgrestError } from "@supabase/supabase-js";
import type { User } from "@/types/user";
import type { StoryRow } from "@/features/stories/utils/storyUtils";

vi.mock("@/server/common/utils/supabaseClient", () => ({
  createServerSupabase: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock("@/server/domain/story/repository", () => ({
  storyRepository: {
    findManyByWorkspaceId: vi.fn(),
    create: vi.fn(),
  },
}));

const WORKSPACE_ID = "ws-1"; // 테스트용 워크스페이스 id

const ERROR_FIELDS = {
  name: "PostgrestError",
  message: "실패",
  details: "",
  hint: "",
  code: "PGRST000",
};
const ERROR: PostgrestError = { ...ERROR_FIELDS, toJSON: () => ERROR_FIELDS };

const SESSION_USER: User = { id: "user-1", name: "나", email: "me@test.com" };

const STORY_ROW: StoryRow = {
  id: "story-1",
  workspace_id: WORKSPACE_ID,
  user_id: SESSION_USER.id,
  title: "제목",
  description: "설명",
  date: "2020-01-01",
  thumbnail_url: undefined,
  path: [],
  path_color: "#fff",
};

/** json() 만 사용하는 라우트에 넘길 최소 요청 객체를 만든다 */
const createRequest = (body: unknown, searchParams?: string) =>
  ({
    json: async () => body,
    nextUrl: { searchParams: new URLSearchParams(searchParams) },
  }) as unknown as NextRequest;

const mockedCreateServerSupabase = vi.mocked(createServerSupabase);
const mockedGetSessionUser = vi.mocked(getSessionUser);
const mockedRepository = vi.mocked(storyRepository);

const CREATE_BODY = {
  workspaceId: WORKSPACE_ID,
  title: "제목",
  description: "설명",
  date: "2020-01-01",
  thumbnailUrl: undefined,
  path: [],
  pathColor: "#fff",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mockedCreateServerSupabase.mockResolvedValue(undefined as never);
  mockedGetSessionUser.mockResolvedValue(SESSION_USER);
  mockedRepository.findManyByWorkspaceId.mockResolvedValue({
    data: [STORY_ROW],
    error: null,
  } as never);
  mockedRepository.create.mockResolvedValue({ data: STORY_ROW, error: null } as never);
});

describe("GET /api/stories", () => {
  it("workspaceId가 없으면 400을 반환한다", async () => {
    const res = await GET(createRequest(null, ""));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "workspaceId가 필요합니다." });
  });

  it("로그인하지 않았으면 401을 반환한다", async () => {
    mockedGetSessionUser.mockResolvedValue(null);

    const res = await GET(createRequest(null, `workspaceId=${WORKSPACE_ID}`));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
  });

  it("조회에 성공하면 스토리 목록을 반환한다", async () => {
    const res = await GET(createRequest(null, `workspaceId=${WORKSPACE_ID}`));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      {
        id: STORY_ROW.id,
        title: STORY_ROW.title,
        description: STORY_ROW.description,
        date: STORY_ROW.date,
        thumbnailUrl: undefined,
        path: [],
        pathColor: STORY_ROW.path_color,
        userId: STORY_ROW.user_id,
        workspaceId: STORY_ROW.workspace_id,
      },
    ]);
  });

  it("DB 에러가 나면 500을 반환한다", async () => {
    mockedRepository.findManyByWorkspaceId.mockResolvedValue({ data: null, error: ERROR } as never);

    const res = await GET(createRequest(null, `workspaceId=${WORKSPACE_ID}`));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "스토리 목록 조회에 실패했습니다." });
  });
});

describe("POST /api/stories", () => {
  it("workspaceId, title, date 중 하나라도 없으면 400을 반환한다", async () => {
    const res = await POST(createRequest({ ...CREATE_BODY, title: "" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "workspaceId, title, date는 필수입니다." });
  });

  it("로그인하지 않았으면 401을 반환한다", async () => {
    mockedGetSessionUser.mockResolvedValue(null);

    const res = await POST(createRequest(CREATE_BODY));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
  });

  it("생성에 성공하면 201과 생성된 스토리를 반환한다", async () => {
    const res = await POST(createRequest(CREATE_BODY));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      id: STORY_ROW.id,
      title: STORY_ROW.title,
      description: STORY_ROW.description,
      date: STORY_ROW.date,
      thumbnailUrl: undefined,
      path: [],
      pathColor: STORY_ROW.path_color,
      userId: STORY_ROW.user_id,
      workspaceId: STORY_ROW.workspace_id,
    });
    expect(mockedRepository.create).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ userId: SESSION_USER.id })
    );
  });

  it("DB 에러가 나면 500을 반환한다", async () => {
    mockedRepository.create.mockResolvedValue({ data: null, error: ERROR } as never);

    const res = await POST(createRequest(CREATE_BODY));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "스토리 생성에 실패했습니다." });
  });
});

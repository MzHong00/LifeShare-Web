import { beforeEach, describe, expect, it, vi } from "vitest";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";
import { storyRepository } from "@/server/domain/story/repository";

import { DELETE, PATCH } from "./route";

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
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const STORY_ID = "story-1"; // 테스트용 스토리 id

const ERROR_FIELDS = {
  name: "PostgrestError",
  message: "실패",
  details: "",
  hint: "",
  code: "PGRST000",
};
const ERROR: PostgrestError = { ...ERROR_FIELDS, toJSON: () => ERROR_FIELDS };

const NOT_FOUND_ERROR: PostgrestError = {
  ...ERROR_FIELDS,
  code: "PGRST116",
  toJSON: () => ERROR_FIELDS,
};

const SESSION_USER: User = { id: "user-1", name: "나", email: "me@test.com" };

const STORY_ROW: StoryRow = {
  id: STORY_ID,
  workspace_id: "ws-1",
  user_id: SESSION_USER.id,
  title: "제목",
  description: "설명",
  date: "2020-01-01",
  thumbnail_url: undefined,
  path: [],
  path_color: "#fff",
};

/** RouteContext 모양의 컨텍스트를 만든다 */
const createContext = () => ({ params: Promise.resolve({ id: STORY_ID }) });

/** json() 만 사용하는 라우트에 넘길 최소 요청 객체를 만든다 */
const createRequest = (body: unknown) => ({ json: async () => body }) as unknown as NextRequest;

const mockedCreateServerSupabase = vi.mocked(createServerSupabase);
const mockedGetSessionUser = vi.mocked(getSessionUser);
const mockedRepository = vi.mocked(storyRepository);

const UPDATE_BODY = { title: "새 제목" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mockedCreateServerSupabase.mockResolvedValue(undefined as never);
  mockedGetSessionUser.mockResolvedValue(SESSION_USER);
  mockedRepository.update.mockResolvedValue({ data: STORY_ROW, error: null } as never);
  mockedRepository.delete.mockResolvedValue({ data: [STORY_ROW], error: null } as never);
});

describe("PATCH /api/stories/[id]", () => {
  it("로그인하지 않았으면 401을 반환한다", async () => {
    mockedGetSessionUser.mockResolvedValue(null);

    const res = await PATCH(createRequest(UPDATE_BODY), createContext());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
  });

  it("수정에 성공하면 수정된 스토리를 반환한다", async () => {
    const res = await PATCH(createRequest(UPDATE_BODY), createContext());

    expect(res.status).toBe(200);
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
  });

  it("매칭되는 스토리가 없으면 404를 반환한다", async () => {
    mockedRepository.update.mockResolvedValue({ data: null, error: NOT_FOUND_ERROR } as never);

    const res = await PATCH(createRequest(UPDATE_BODY), createContext());

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "스토리를 찾을 수 없습니다." });
  });

  it("DB 에러가 나면 500을 반환한다", async () => {
    mockedRepository.update.mockResolvedValue({ data: null, error: ERROR } as never);

    const res = await PATCH(createRequest(UPDATE_BODY), createContext());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "스토리 수정에 실패했습니다." });
  });
});

describe("DELETE /api/stories/[id]", () => {
  it("로그인하지 않았으면 401을 반환한다", async () => {
    mockedGetSessionUser.mockResolvedValue(null);

    const res = await DELETE(createRequest(null), createContext());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "로그인이 필요합니다." });
  });

  it("삭제에 성공하면 204를 반환한다", async () => {
    const res = await DELETE(createRequest(null), createContext());

    expect(res.status).toBe(204);
  });

  it("매칭되는 스토리가 없으면 404를 반환한다", async () => {
    mockedRepository.delete.mockResolvedValue({ data: [], error: null } as never);

    const res = await DELETE(createRequest(null), createContext());

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "스토리를 찾을 수 없습니다." });
  });

  it("DB 에러가 나면 500을 반환한다", async () => {
    mockedRepository.delete.mockResolvedValue({ data: null, error: ERROR } as never);

    const res = await DELETE(createRequest(null), createContext());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "스토리 삭제에 실패했습니다." });
  });
});

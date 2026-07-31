import { withParams, withQuery } from "@/utils/route";

export const ROUTES = {
  LOGIN: {
    path: "/login",
    query: (params: { redirect?: string }) => withQuery("/login", params),
  },
  AUTH: {
    CALLBACK: {
      path: "/auth/callback",
      query: (params: { redirect?: string }) => withQuery("/auth/callback", params),
    },
  },
  HOME: { path: "/home" },
  CHAT: { path: "/chat" },
  MAP: { path: "/map" },
  CALENDAR: {
    path: "/calendar",
    query: (params: { date?: string }) => withQuery("/calendar", params),
  },
  ANNIVERSARY: { path: "/anniversary" },

  STORIES: {
    path: "/stories",
    LIST: { path: "/stories/list" },
    EDIT: {
      path: "/stories/edit",
      query: (params: { storyId?: string }) => withQuery("/stories/edit", params),
    },
    detail: (id: string) => withParams("/stories", id),
  },

  PROFILE: {
    path: "/profile",
    PRIVACY: { path: "/profile/privacy" },
    SETTINGS: { path: "/profile/settings" },
  },

  TODO: {
    path: "/todo",
    CREATE: {
      path: "/todo/create",
      query: (params: { todoId?: string; initialDate?: string }) =>
        withQuery("/todo/create", params),
    },
  },

  WORKSPACE: {
    path: "/workspace",
    LANDING: { path: "/workspace/landing" },
    SETUP: { path: "/workspace/setup" },
    LIST: { path: "/workspace/list" },
    EDIT: {
      path: "/workspace/edit",
      query: (params: { workspaceId?: string }) => withQuery("/workspace/edit", params),
    },
    JOIN: { path: "/workspace/join" },
    join: (code: string) => withParams("/workspace/join", code),
  },
} as const;

// 비로그인 상태로 접근 가능한 경로 접두사 (proxy의 인증 guard가 참조)
export const PUBLIC_PATH_PREFIXES = [
  ROUTES.LOGIN.path,
  ROUTES.AUTH.CALLBACK.path,
  ROUTES.WORKSPACE.JOIN.path,
] as const;

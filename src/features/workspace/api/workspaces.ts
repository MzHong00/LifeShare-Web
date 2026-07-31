import { bffFetch } from "@/lib/api/bffClient";

import type { RoomType, ThemeColor, Workspace } from "@/features/workspace/types/workspace";

export const workspacesApi = {
  // 내가 속한 워크스페이스 목록 (멤버 포함, 사용자는 서버가 세션에서 확정)
  listMine: async (): Promise<Workspace[]> =>
    bffFetch<Workspace[]>("/api/workspaces", "워크스페이스 목록 조회에 실패했습니다."),

  // 워크스페이스 생성 + 생성자 멤버 추가 (생성자는 서버가 세션에서 확정)
  create: async (
    name: string,
    type: RoomType,
    startDate: string | undefined
  ): Promise<{ workspace: Workspace }> =>
    bffFetch<{ workspace: Workspace }>("/api/workspaces", "워크스페이스 생성에 실패했습니다.", {
      method: "POST",
      body: JSON.stringify({ name, type, startDate }),
    }),

  // 초대 코드로 워크스페이스 조회
  getByInviteCode: async (code: string): Promise<Workspace | null> =>
    bffFetch<Workspace | null>(
      `/api/workspace-invites/${encodeURIComponent(code)}`,
      "초대 코드 조회에 실패했습니다."
    ),

  // 워크스페이스 참여 (참여자는 서버가 세션에서 확정)
  join: async (workspaceId: string): Promise<Workspace> =>
    bffFetch<Workspace>(
      `/api/workspaces/${encodeURIComponent(workspaceId)}/join`,
      "워크스페이스 참여에 실패했습니다.",
      { method: "POST" }
    ),

  // 워크스페이스 이름 수정
  updateName: async (workspaceId: string, name: string): Promise<void> =>
    bffFetch<void>(
      `/api/workspaces/${encodeURIComponent(workspaceId)}`,
      "워크스페이스 이름 수정에 실패했습니다.",
      {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }
    ),

  // 워크스페이스 시작일 수정
  updateStartDate: async (workspaceId: string, startDate: string): Promise<void> =>
    bffFetch<void>(
      `/api/workspaces/${encodeURIComponent(workspaceId)}`,
      "워크스페이스 시작일 수정에 실패했습니다.",
      {
        method: "PATCH",
        body: JSON.stringify({ startDate }),
      }
    ),

  // 워크스페이스 색상 테마 수정
  updateThemeColor: async (workspaceId: string, themeColor: ThemeColor): Promise<void> =>
    bffFetch<void>(
      `/api/workspaces/${encodeURIComponent(workspaceId)}`,
      "워크스페이스 테마 색상 수정에 실패했습니다.",
      {
        method: "PATCH",
        body: JSON.stringify({ themeColor }),
      }
    ),

  // 초대 코드 생성 (발급자는 서버가 세션에서 확정)
  createInviteCode: async (workspaceId: string): Promise<string> => {
    const { code } = await bffFetch<{ code: string }>(
      `/api/workspaces/${encodeURIComponent(workspaceId)}/invites`,
      "초대 코드 생성에 실패했습니다.",
      { method: "POST" }
    );
    return code;
  },

  // 워크스페이스 나가기 (본인 멤버 row 삭제, 서버가 세션과 대조해 본인만 허용)
  leave: async (workspaceId: string, userId: string): Promise<void> =>
    bffFetch<void>(
      `/api/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(userId)}`,
      "워크스페이스 나가기에 실패했습니다.",
      { method: "DELETE" }
    ),

  // 멤버 프로필 업데이트 (서버가 세션과 대조해 본인만 허용)
  updateMember: async (
    workspaceId: string,
    userId: string,
    updates: { displayName?: string; avatarUrl?: string }
  ): Promise<void> =>
    bffFetch<void>(
      `/api/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(userId)}`,
      "멤버 프로필 수정에 실패했습니다.",
      {
        method: "PATCH",
        body: JSON.stringify(updates),
      }
    ),
};

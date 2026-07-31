import "server-only";

import type { SupabaseClient, PostgrestError } from "@supabase/supabase-js";
import type { RoomType, Workspace, WorkspaceMember } from "@/features/workspace/types/workspace";

// select 시 DB 컬럼(snake_case) → 프론트 타입(camelCase)으로 alias
const WORKSPACE_COLUMNS =
  "id, name, type, startDate:start_date, backgroundImage:background_image, themeColor:theme_color";

// 워크스페이스 삭제 시 함께 지워야 하는 콘텐츠 테이블.
// workspace_members는 여기 넣지 않는다 — RLS 정책이 멤버십으로 권한을 판별하므로,
// 멤버 row를 먼저 지우면 정작 workspaces를 지울 때 권한을 잃어 삭제가 막힌다(맨 마지막에 정리).
const WORKSPACE_CONTENT_TABLES = [
  "messages",
  "todos",
  "stories",
  "calendar_events",
  "workspace_invites",
] as const;
const MEMBER_COLUMNS = "id:user_id, name:display_name, email, avatar:avatar_url";

interface NewMember {
  userId: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
}

type WorkspaceFields = Omit<Workspace, "members">; // WORKSPACE_COLUMNS로 select한 결과 모양
type MemberWithWorkspaceId = WorkspaceMember & { workspace_id: string }; // 목록 조회용: 소속 워크스페이스 식별자 포함

/** 특정 워크스페이스의 멤버 목록을 가져온다 */
const findMembers = async (
  supabase: SupabaseClient,
  workspaceId: string
): Promise<WorkspaceMember[]> => {
  const { data } = await supabase
    .from("workspace_members")
    .select(MEMBER_COLUMNS)
    .eq("workspace_id", workspaceId);
  return (data ?? []) as unknown as WorkspaceMember[];
};

export const workspaceRepository = {
  /** 워크스페이스 하나를 멤버 포함해서 가져온다 (참여/초대 조회 공용) */
  findById: async (
    supabase: SupabaseClient,
    workspaceId: string
  ): Promise<{ data: Workspace | null; error: PostgrestError | null }> => {
    const [{ data: ws, error }, members] = await Promise.all([
      supabase.from("workspaces").select(WORKSPACE_COLUMNS).eq("id", workspaceId).single(),
      findMembers(supabase, workspaceId),
    ]);
    if (error || !ws) return { data: null, error };

    return { data: { ...(ws as unknown as WorkspaceFields), members }, error: null };
  },

  /** 내가 속한 워크스페이스 전부를 멤버 포함해서 가져온다 */
  findManyByUserId: async (
    supabase: SupabaseClient,
    userId: string
  ): Promise<{ data: Workspace[]; error: PostgrestError | null }> => {
    const { data: memberRows, error: memberError } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId);
    if (memberError) return { data: [], error: memberError };

    const workspaceIds = memberRows?.map((r) => r.workspace_id) ?? [];
    if (workspaceIds.length === 0) return { data: [], error: null };

    // 워크스페이스와 멤버 목록은 서로 독립이므로 병렬 조회
    const [{ data: workspaces, error: wsError }, { data: members, error: membersError }] =
      await Promise.all([
        supabase.from("workspaces").select(WORKSPACE_COLUMNS).in("id", workspaceIds),
        supabase
          .from("workspace_members")
          .select(`workspace_id, ${MEMBER_COLUMNS}`)
          .in("workspace_id", workspaceIds),
      ]);
    if (wsError) return { data: [], error: wsError };
    if (membersError) return { data: [], error: membersError };

    const memberList = (members ?? []) as unknown as MemberWithWorkspaceId[];
    const data = (workspaces as unknown as WorkspaceFields[])?.map((ws) => ({
      ...ws,
      members: memberList.filter((m) => m.workspace_id === ws.id),
    }));
    return { data: data ?? [], error: null };
  },

  /** 워크스페이스를 생성한다 */
  create: async (
    supabase: SupabaseClient,
    input: { name: string; type: RoomType; startDate?: string; createdBy: string }
  ) =>
    supabase
      .from("workspaces")
      .insert({
        name: input.name,
        type: input.type,
        start_date: input.startDate || null,
        created_by: input.createdBy,
      })
      .select(WORKSPACE_COLUMNS)
      .single(),

  /** 워크스페이스의 멤버 수를 센다 (나가는 사람이 마지막 멤버인지 판별용) */
  countMembers: async (
    supabase: SupabaseClient,
    workspaceId: string
  ): Promise<{ count: number | null; error: PostgrestError | null }> => {
    const { count, error } = await supabase
      .from("workspace_members")
      .select("user_id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);
    return { count, error };
  },

  /**
   * 워크스페이스와 하위 데이터를 모두 삭제한다. (콘텐츠 → 워크스페이스 → 멤버 순)
   *
   * 순서가 중요하다: RLS 정책이 멤버십으로 권한을 판별하므로 workspace_members를 먼저 지우면
   * 정작 workspaces를 지울 권한을 잃어 삭제가 조용히 막힌다. 그래서 멤버 정리는 맨 마지막에 한다.
   * 또한 delete의 RETURNING 결과도 SELECT 정책에 걸러질 수 있어, 성공 여부는 재조회로 확인한다.
   */
  deleteById: async (
    supabase: SupabaseClient,
    workspaceId: string
  ): Promise<{ isDeleted: boolean; error: PostgrestError | null }> => {
    for (const table of WORKSPACE_CONTENT_TABLES) {
      const { error } = await supabase.from(table).delete().eq("workspace_id", workspaceId);
      if (error) return { isDeleted: false, error };
    }

    const { error: deleteError } = await supabase.from("workspaces").delete().eq("id", workspaceId);
    if (deleteError) return { isDeleted: false, error: deleteError };

    // 멤버십이 살아 있는 지금 확인해야 조회가 RLS를 통과한다 (멤버를 지운 뒤에는 조회 자체가 막힘)
    const { data: remaining, error: checkError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("id", workspaceId)
      .maybeSingle();
    if (checkError) return { isDeleted: false, error: checkError };
    if (remaining) return { isDeleted: false, error: null }; // DELETE 정책 부재 등으로 삭제가 반영되지 않음

    // 워크스페이스가 사라졌으니 멤버 row도 정리한다 (CASCADE로 이미 지워졌다면 no-op)
    await supabase.from("workspace_members").delete().eq("workspace_id", workspaceId);
    return { isDeleted: true, error: null };
  },

  /** 멤버를 추가한다 (생성 시 본인 등록, 초대 참여 공용) */
  insertMember: async (supabase: SupabaseClient, workspaceId: string, member: NewMember) =>
    supabase.from("workspace_members").insert({
      workspace_id: workspaceId,
      user_id: member.userId,
      display_name: member.name,
      email: member.email,
      avatar_url: member.avatarUrl,
    }),

  /** 특정 사용자가 속한 모든 워크스페이스의 멤버 정보(이름·사진)를 동기화한다 */
  updateMemberProfile: async (
    supabase: SupabaseClient,
    userId: string,
    input: { name?: string; avatarUrl?: string }
  ) =>
    supabase
      .from("workspace_members")
      .update({
        ...(input.name !== undefined && { display_name: input.name }),
        ...(input.avatarUrl !== undefined && { avatar_url: input.avatarUrl }),
      })
      .eq("user_id", userId),
};

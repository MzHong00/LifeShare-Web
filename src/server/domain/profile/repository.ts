import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileUpsertInputDto } from "@/server/domain/profile/dto";

export const profileRepository = {
  /** 세션 사용자의 프로필(이름·사진)을 가져온다 */
  findById: (supabase: SupabaseClient, userId: string) =>
    supabase.from("profiles").select("name, avatar_url").eq("id", userId).maybeSingle(),

  /** 프로필이 없으면 생성한다 (이미 있으면 무시) */
  createIfNotExists: (supabase: SupabaseClient, userId: string, input: ProfileUpsertInputDto) =>
    supabase
      .from("profiles")
      .upsert(
        { id: userId, name: input.name, avatar_url: input.avatarUrl },
        { onConflict: "id", ignoreDuplicates: true }
      ),

  /** 프로필을 수정한다 (변경된 필드만 upsert) */
  update: (supabase: SupabaseClient, userId: string, input: ProfileUpsertInputDto) =>
    supabase.from("profiles").upsert({
      id: userId,
      ...(input.name !== undefined && { name: input.name }),
      ...(input.avatarUrl !== undefined && { avatar_url: input.avatarUrl }),
    }),
};

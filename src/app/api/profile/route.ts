import { NextResponse } from "next/server";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";
import { profileRepository } from "@/server/domain/profile/repository";
import { workspaceRepository } from "@/server/domain/workspace/repository";

import type { NextRequest } from "next/server";
import type { ProfileUpdateRequestDto } from "@/server/domain/profile/dto";
import type { User } from "@/types/user";

/** GET /api/profile — 전역 프로필(이름·사진) 조회. profiles 테이블만 읽으며 시드는 하지 않는다 */
export async function GET() {
  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { data: profile } = await profileRepository.findById(supabase, sessionUser.id);

  const user: User = {
    id: sessionUser.id,
    name: profile?.name ?? "",
    email: sessionUser.email,
    profileImage: profile?.avatar_url,
  };
  return NextResponse.json(user);
}

/** POST /api/profile — 로그인 직후 1회 호출, profiles row가 없으면 구글 메타데이터로 생성한다 */
export async function POST() {
  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  // 이미 있으면 무시, 없으면 구글 메타데이터로 생성한다 (반환값이 필요 없으므로 조회 없이 한 번에 처리)
  const { error } = await profileRepository.createIfNotExists(supabase, sessionUser.id, {
    name: sessionUser.name,
    avatarUrl: sessionUser.profileImage,
  });
  if (error) {
    console.error("[api] 프로필 생성 실패", error);
    return NextResponse.json({ message: "프로필 생성에 실패했습니다." }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}

/** PATCH /api/profile — 전역 프로필(이름·사진) 수정 + 참여 중인 모든 라이프룸 멤버 정보 동기화 */
export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as ProfileUpdateRequestDto;

  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  // user_metadata는 구글 재로그인마다 원본 값으로 덮어써지므로 진짜 소스로 쓸 수 없다 — profiles 테이블에 upsert한다
  const { error: profileError } = await profileRepository.update(supabase, sessionUser.id, {
    name: body.name,
    avatarUrl: body.profileImage,
  });
  if (profileError) {
    console.error("[api] 프로필 수정 실패", profileError);
    return NextResponse.json({ message: "프로필 수정에 실패했습니다." }, { status: 500 });
  }

  // 참여 중인 모든 라이프룸의 멤버 정보에도 최신 프로필을 그대로 반영한다 (워크스페이스별 개별 프로필은 지원하지 않음)
  const { error: syncError } = await workspaceRepository.updateMemberProfile(
    supabase,
    sessionUser.id,
    {
      name: body.name,
      avatarUrl: body.profileImage,
    }
  );
  if (syncError) {
    console.error("[api] 라이프룸 멤버 정보 동기화 실패", syncError);
    return NextResponse.json(
      { message: "라이프룸 멤버 정보 동기화에 실패했습니다." },
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 204 });
}

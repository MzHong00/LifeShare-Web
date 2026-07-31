import { NextResponse } from "next/server";

import { createServerSupabase, getSessionUser } from "@/server/common/utils/supabaseClient";
import { messageRepository } from "@/server/domain/message/repository";
import { rowToChatMessage } from "@/features/chat/api/chat";

import type { NextRequest } from "next/server";
import type { MessageRow } from "@/features/chat/api/chat";
import type { MessageSendRequestDto } from "@/server/domain/message/dto";

/** GET /api/messages?workspaceId= — 워크스페이스의 메시지 목록 (오래된 순, isMine은 세션 사용자 기준) */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId)
    return NextResponse.json({ message: "workspaceId가 필요합니다." }, { status: 400 });

  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { data, error } = await messageRepository.findManyByWorkspaceId(supabase, workspaceId);
  if (error) {
    console.error("[api] 메시지 목록 조회 실패", error);
    return NextResponse.json({ message: "메시지 목록 조회에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json(
    (data as MessageRow[]).map((row) => rowToChatMessage(row, sessionUser.id))
  );
}

/** POST /api/messages — 메시지 전송 (발신자는 세션 사용자로 확정, 실시간 반영은 클라이언트 구독이 담당) */
export async function POST(request: NextRequest) {
  const { workspaceId, text } = (await request.json()) as MessageSendRequestDto;
  if (!workspaceId || !text)
    return NextResponse.json({ message: "workspaceId, text는 필수입니다." }, { status: 400 });

  const supabase = await createServerSupabase();
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { error } = await messageRepository.create(supabase, workspaceId, sessionUser.id, text);
  if (error) {
    console.error("[api] 메시지 전송 실패", error);
    return NextResponse.json({ message: "메시지 전송에 실패했습니다." }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}

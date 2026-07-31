/** 메시지 전송 요청 본문 (발신자는 세션에서 확정) */
export interface MessageSendRequestDto {
  workspaceId: string; // 소속 워크스페이스 ID
  text: string; // 메시지 본문
}

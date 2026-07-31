"use client";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ChatHeader } from "@/features/chat/components/ChatHeader";
import { MessageList } from "@/features/chat/components/MessageList";
import { ChatInput } from "@/features/chat/components/ChatInput";
import { ChatPartnerEmpty } from "@/features/chat/components/ChatPartnerEmpty";
import { useChatMessages } from "@/features/chat/hooks/useChatMessages";
import { useChatViewport } from "@/features/chat/hooks/useChatViewport";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { authQueries } from "@/features/auth/queries/authQueries";

import styles from "./ChatView.module.scss";

export const ChatView = () => {
  const [inputText, setInputText] = useState(""); // 입력바 텍스트
  const { currentWorkspace, isPending: isWorkspacePending } = useCurrentWorkspace();
  const { data: user } = useQuery(authQueries.user());
  const { messages, isLoading, isError, sendMessage } = useChatMessages(
    currentWorkspace?.id ?? "",
    user?.id ?? ""
  );
  const { bottomRef } = useChatViewport(messages);
  // 나를 제외한 채팅 상대 전원 — memo로 참조를 고정해 ChatHeader의 memo가 유효하게 유지
  const partners = useMemo(
    () => currentWorkspace?.members?.filter((m) => m.id !== user?.id) ?? [],
    [currentWorkspace?.members, user?.id]
  );

  /** 현재 입력값을 전송하고 입력바를 비운다 (전송 실패 시 입력값 복원) */
  const handleSend = () => {
    const textToSend = inputText;
    sendMessage(textToSend, () => setInputText(textToSend));
    setInputText("");
  };

  return (
    <div className={styles.page}>
      <div className={styles.board}>
        {/* 로딩 완료 후에도 참여자가 없으면 채팅 UI 대신 빈 상태를 노출 (로딩 중에는 기존 스켈레톤 유지) */}
        {!isWorkspacePending && partners.length === 0 ? (
          <ChatPartnerEmpty />
        ) : (
          <>
            <ChatHeader partners={partners} />

            <MessageList
              messages={messages}
              isLoading={isLoading}
              isError={isError}
              members={currentWorkspace?.members}
              bottomRef={bottomRef}
              className={styles.messages}
            />

            {!isLoading && (
              <div className={styles.inputArea}>
                <ChatInput value={inputText} onChange={setInputText} onSend={handleSend} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

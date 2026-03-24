"use client";
import { useState, useRef, useEffect } from "react";
import { Image as ImageIcon, Video } from "lucide-react";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";
import { formatChatTime } from "@/utils/date";
import type { ChatMessage } from "@/types";
import styles from "./chat.module.scss";

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: "1", text: "오늘 저녁에 뭐 먹을까?", sender: "partner", time: "오후 2:30" },
  { id: "2", text: "음 글쎄", sender: "me", time: "오후 2:31" },
  { id: "3", text: "파스타 어때? 저번에 가보고 싶다던 곳!", sender: "me", time: "오후 2:32" },
  { id: "4", text: "좋아! 7시에 역 앞에서 만나", sender: "partner", time: "오후 2:33" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isActionMenuVisible, setIsActionMenuVisible] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  const partner = currentWorkspace?.members?.find((m) => m.id !== "user-1") || {
    name: "파트너",
    avatar: undefined,
    email: "",
    id: "partner",
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 키패드가 올라올 때 페이지 높이를 visual viewport에 맞게 동적 조정
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      if (pageRef.current) {
        pageRef.current.style.height = `${vv.height}px`;
      }
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "instant" });
      }, 50);
    };

    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: "me",
      time: formatChatTime(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
  };

  const actionItems = [
    { id: "gallery", label: "갤러리", icon: <ImageIcon size={24} /> },
    { id: "video", label: "동영상", icon: <Video size={24} /> },
  ];

  return (
    <div ref={pageRef} className={styles.page}>
      <div className={styles.chatHeader}>
        <ProfileAvatar uri={partner.avatar} name={partner.name} size={40} />
        <div>
          <p className={styles.partnerName}>{partner.name}</p>
          <p className={styles.onlineStatus}>현재 활동 중</p>
        </div>
      </div>

      <div className={styles.messages}>
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            text={msg.text}
            sender={msg.sender}
            time={msg.time}
            avatar={msg.sender === "partner" ? partner.avatar : undefined}
            name={msg.sender === "partner" ? partner.name : undefined}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {isActionMenuVisible && (
        <div className={styles.actionMenu}>
          {actionItems.map((item) => (
            <button key={item.id} className={styles.actionItem}>
              <div className={styles.actionIcon}>{item.icon}</div>
              <span className={styles.actionLabel}>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      <ChatInput
        value={inputText}
        onChange={setInputText}
        onSend={sendMessage}
        onPlusPress={() => setIsActionMenuVisible(!isActionMenuVisible)}
      />
    </div>
  );
}

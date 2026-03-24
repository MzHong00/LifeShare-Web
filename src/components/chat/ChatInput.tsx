"use client";
import { Plus, Send } from "lucide-react";
import styles from "./ChatInput.module.scss";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onPlusPress: () => void;
}

export const ChatInput = ({ value, onChange, onSend, onPlusPress }: ChatInputProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={styles.inputRow}>
      <button type="button" onClick={onPlusPress} className={styles.plusButton}>
        <Plus size={20} />
      </button>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="메시지를 입력하세요"
        className={styles.input}
      />
      <button
        type="button"
        onClick={onSend}
        disabled={!value.trim()}
        className={[
          styles.sendButton,
          value.trim() ? styles.sendButtonActive : styles.sendButtonInactive
        ].filter(Boolean).join(' ')}
      >
        <Send size={16} color={value.trim() ? "#ffffff" : "var(--grey-400)"} />
      </button>
    </div>
  );
};

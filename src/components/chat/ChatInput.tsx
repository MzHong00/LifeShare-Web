"use client";
import { useState, useRef } from "react";
import { Send, Plus, Image, Camera, MapPin, Gift } from "lucide-react";
import styles from "./ChatInput.module.scss";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}

// 도구함 아이템 목록
const ACTION_ITEMS = [
  { id: "gallery", Icon: Image, label: "갤러리" },
  { id: "camera", Icon: Camera, label: "카메라" },
  { id: "location", Icon: MapPin, label: "위치" },
  { id: "gift", Icon: Gift, label: "선물" },
];

export const ChatInput = ({ value, onChange, onSend }: ChatInputProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
      inputRef.current?.focus();
    }
  };

  const handleSend = () => {
    onSend();
    setIsMenuOpen(false);
    inputRef.current?.focus();
  };

  const handlePlusClick = () => {
    setIsMenuOpen((prev) => !prev);
    inputRef.current?.focus();
  };

  return (
    <div className={styles.wrapper}>
      {/* 도구함 */}
      {isMenuOpen && (
        <div className={styles.actionMenu}>
          {ACTION_ITEMS.map(({ id, Icon, label }) => (
            <button key={id} className={styles.actionItem} onClick={() => setIsMenuOpen(false)}>
              <div className={styles.actionIcon}>
                <Icon size={20} />
              </div>
              <span className={styles.actionLabel}>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 인풋 바 */}
      <div className={styles.container}>
        <button
          type="button"
          onClick={handlePlusClick}
          className={[styles.plusButton, isMenuOpen ? styles.plusButtonActive : ""].join(" ")}
        >
          <Plus size={18} />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지..."
          className={styles.input}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!value.trim()}
          className={[
            styles.sendButton,
            value.trim() ? styles.sendButtonActive : styles.sendButtonInactive,
          ].join(" ")}
        >
          <Send size={14} color={value.trim() ? "#ffffff" : "var(--grey-400)"} />
        </button>
      </div>
    </div>
  );
};

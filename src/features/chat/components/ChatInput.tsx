"use client";
import { useState, useRef } from "react";
import { Send, Plus } from "lucide-react";

import { cx } from "@/utils/cn";
import { CHAT_ACTION_ITEMS } from "@/features/chat/constants/chat";
import { toastActions } from "@/stores/useToastStore";

import styles from "./ChatInput.module.scss";

interface ChatInputProps {
  value: string;
  /** 입력값 변경 콜백 */
  onChange: (value: string) => void;
  /** 메시지 전송 콜백 */
  onSend: () => void;
}

export const ChatInput = ({ value, onChange, onSend }: ChatInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 도구함 펼침 여부

  const isSendable = Boolean(value.trim()); // 전송 가능(공백 외 입력) 여부

  /** Enter(Shift 제외) 입력 시 전송하고 포커스를 유지한다 · IME 조합 중에는 무시(한글 중복 전송 방지) */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSend();
      inputRef.current?.focus();
    }
  };

  /** 전송 후 도구함을 닫고 포커스를 유지한다 */
  const handleSend = () => {
    onSend();
    setIsMenuOpen(false);
    inputRef.current?.focus();
  };

  /** 도구함 펼침을 토글한다 (포커스를 주면 모바일 키패드가 열리므로 호출하지 않음) */
  const handlePlusClick = () => {
    setIsMenuOpen((prev) => !prev);
  };

  /** 아직 구현되지 않은 도구함 액션을 안내하고 도구함을 닫는다 */
  const handleActionItemClick = (label: string) => {
    toastActions.showToast(`${label} 기능은 준비 중입니다`, "info");
    setIsMenuOpen(false);
  };

  return (
    <div className={styles.wrapper}>
      {isMenuOpen && (
        <div className={styles.actionMenu}>
          {CHAT_ACTION_ITEMS.map(({ id, Icon, label }) => (
            <button
              key={id}
              className={styles.actionItem}
              onClick={() => handleActionItemClick(label)}
            >
              <div className={styles.actionIcon}>
                <Icon size={20} />
              </div>
              <span className={styles.actionLabel}>{label}</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.container}>
        <button
          type="button"
          onClick={handlePlusClick}
          className={cx(styles.plusButton, isMenuOpen && styles.plusButtonActive)}
          aria-label={isMenuOpen ? "도구함 닫기" : "도구함 열기"}
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
          disabled={!isSendable}
          className={cx(
            styles.sendButton,
            isSendable ? styles.sendButtonActive : styles.sendButtonInactive
          )}
          aria-label="메시지 전송"
        >
          <Send size={14} className={styles.sendIcon} />
        </button>
      </div>
    </div>
  );
};

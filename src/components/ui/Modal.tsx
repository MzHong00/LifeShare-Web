"use client";
import { useState } from "react";

import { useModalStore, modalActions } from "@/stores/useModalStore";

import styles from "./Modal.module.scss";

import type { ModalConfig } from "@/types/modal";

export const Modal = () => {
  const modal = useModalStore((s) => s.modal);

  if (!modal) return null;

  // 본문을 분리해 모달이 닫힐 때 언마운트시킨다 — 다음에 열릴 때 이전 입력값이 남지 않도록
  return <ModalContent modal={modal} />;
};

interface ModalContentProps {
  modal: ModalConfig;
}

const ModalContent = ({ modal }: ModalContentProps) => {
  const [typedPhrase, setTypedPhrase] = useState(""); // confirmPhrase 확인용 입력값

  // 확인 문구가 지정된 모달은 문구가 정확히 일치할 때만 확인 버튼이 열린다
  const isConfirmLocked = !!modal.confirmPhrase && typedPhrase.trim() !== modal.confirmPhrase;

  const handleConfirm = () => {
    if (isConfirmLocked) return;
    modal.onConfirm?.();
    modalActions.hideModal();
  };

  const handleCancel = () => {
    modal.onCancel?.();
    modalActions.hideModal();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={handleCancel} />
      <div className={styles.container}>
        <div className={styles.body}>
          {modal.title && <h3 className={styles.title}>{modal.title}</h3>}
          {modal.message && <p className={styles.message}>{modal.message}</p>}
          {modal.content && <div className={styles.content}>{modal.content}</div>}

          {modal.confirmPhrase && (
            <div className={styles.phraseField}>
              {/* 문구 뒤에 "문구를"이 붙어 조사가 고정되므로 어떤 확인 문구를 넣어도 문장이 어색해지지 않는다 */}
              <p className={styles.phraseHint}>
                계속하려면 <strong className={styles.phraseWord}>{modal.confirmPhrase}</strong>{" "}
                문구를 입력해주세요
              </p>
              <input
                value={typedPhrase}
                onChange={(event) => setTypedPhrase(event.target.value)}
                placeholder={modal.confirmPhrase}
                autoFocus
                className={styles.phraseInput}
              />
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {modal.type === "confirm" && (
            <button onClick={handleCancel} className={styles.cancelButton}>
              {modal.cancelText ?? "취소"}
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={isConfirmLocked}
            className={styles.confirmButton}
          >
            {modal.confirmText ?? "확인"}
          </button>
        </div>
      </div>
    </div>
  );
};

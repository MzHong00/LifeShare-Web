"use client";
import { useModalStore, modalActions } from "@/stores/useModalStore";
import styles from "./Modal.module.scss";

export const Modal = () => {
  const modal = useModalStore((s) => s.modal);

  if (!modal) return null;

  const handleConfirm = () => {
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
          <h3 className={styles.title}>{modal.title}</h3>
          {modal.message && (
            <p className={styles.message}>{modal.message}</p>
          )}
          {modal.content && <div className={styles.content}>{modal.content}</div>}
        </div>

        <div className={styles.actions}>
          {modal.type === "confirm" && (
            <button onClick={handleCancel} className={styles.cancelButton}>
              {modal.cancelText ?? "취소"}
            </button>
          )}
          <button onClick={handleConfirm} className={styles.confirmButton}>
            {modal.confirmText ?? "확인"}
          </button>
        </div>
      </div>
    </div>
  );
};

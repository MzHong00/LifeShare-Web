"use client";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

import type { ModalConfig } from "@/types/modal";

interface ModalState {
  modal: ModalConfig | null;
}

const modalStore = create<ModalState>()(() => ({ modal: null }));

/** 모달 상태 셀렉터 훅 (useShallow 내장) */
export const useModalStore = <T>(selector: (state: ModalState) => T) =>
  modalStore(useShallow(selector));

export const modalActions = {
  /** 모달을 띄운다 */
  showModal: (config: ModalConfig) => modalStore.setState({ modal: config }),
  /** 모달을 닫는다 */
  hideModal: () => modalStore.setState({ modal: null }),
};

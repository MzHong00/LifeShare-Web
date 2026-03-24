"use client";
import { create } from "zustand";
import type { ModalConfig } from "@/types";

interface ModalState {
  modal: ModalConfig | null;
}

const modalStore = create<ModalState>()(() => ({ modal: null }));

export const useModalStore = <T = ModalState>(
  selector: (state: ModalState) => T = (state) => state as unknown as T
) => modalStore(selector);

export const modalActions = {
  showModal: (config: ModalConfig) => modalStore.setState({ modal: config }),
  hideModal: () => modalStore.setState({ modal: null }),
};

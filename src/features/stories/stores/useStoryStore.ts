"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type { LocationPoint } from "@/features/stories/types/story";

interface StoryState {
  isRecording: boolean;
  recordingPath: LocationPoint[];
  selectedStoryId: string | null;
}

const storyStore = create<StoryState>()(
  persist(
    (): StoryState => ({
      isRecording: false,
      recordingPath: [],
      selectedStoryId: null,
    }),
    {
      name: "story-storage",
      version: 2,
      migrate: () => ({
        isRecording: false,
        recordingPath: [],
        selectedStoryId: null,
      }),
    }
  )
);

/** 스토리 기록/선택 상태 셀렉터 훅 (useShallow 내장) */
export const useStoryStore = <T>(selector: (state: StoryState) => T) =>
  storyStore(useShallow(selector));

export const storyActions = {
  startRecording: () => storyStore.setState({ isRecording: true, recordingPath: [] }),
  stopRecording: () => storyStore.setState({ isRecording: false }),
  setSelectedStoryId: (id: string | null) => storyStore.setState({ selectedStoryId: id }),
  addLocationPoint: (point: LocationPoint) =>
    storyStore.setState((state) => ({
      recordingPath: [...state.recordingPath, point],
    })),
  clearRecording: () => storyStore.setState({ recordingPath: [], isRecording: false }),
};

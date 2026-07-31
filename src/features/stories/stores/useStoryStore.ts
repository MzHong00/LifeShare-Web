"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
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

export const useStoryStore = <T>(selector: (state: StoryState) => T) => storyStore(selector);

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

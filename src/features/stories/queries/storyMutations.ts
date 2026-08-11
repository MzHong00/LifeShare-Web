import { useMutation, useQueryClient } from "@tanstack/react-query";

import { storiesApi } from "@/features/stories/api/stories";
import { storyKeys } from "@/features/stories/queries/storyQueries";

import type { StoryCreateRequestDto, StoryUpdateRequestDto } from "@/server/domain/story/dto";

export const useCreateStoryMutation = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (story: StoryCreateRequestDto) => storiesApi.create(story),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storyKeys.list(workspaceId) }),
  });
};

export const useUpdateStoryMutation = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StoryUpdateRequestDto }) =>
      storiesApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storyKeys.list(workspaceId) }),
  });
};

export const useDeleteStoryMutation = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storiesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storyKeys.list(workspaceId) }),
  });
};

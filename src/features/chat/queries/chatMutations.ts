import { useMutation } from "@tanstack/react-query";

import { chatApi } from "@/features/chat/api/chat";

export const useSendMessageMutation = () =>
  useMutation({
    mutationFn: ({ workspaceId, text }: { workspaceId: string; text: string }) =>
      chatApi.send(workspaceId, text),
  });

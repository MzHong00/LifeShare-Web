"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Workspace, WorkspaceInvitation } from "@/types";
import { MOCK_DATA } from "@/constants/mockData";

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  invitations: WorkspaceInvitation[];
}

const workspaceStore = create<WorkspaceState>()(
  persist(
    (): WorkspaceState => ({
      currentWorkspace: null,
      workspaces: [],
      invitations: [],
    }),
    { name: "workspace-storage" }
  )
);

export const useWorkspaceStore = <T = WorkspaceState>(
  selector: (state: WorkspaceState) => T = (state) => state as unknown as T
) => workspaceStore(selector);

export const workspaceActions = {
  setCurrentWorkspace: (workspace: Workspace | null) =>
    workspaceStore.setState({ currentWorkspace: workspace }),

  createNewWorkspace: (
    name: string,
    type: "couple" | "group",
    isMain: boolean,
    startDate?: string
  ): string => {
    const id = `ws-${Date.now()}`;
    const newWorkspace: Workspace = {
      id,
      name,
      type,
      startDate,
      members: [
        { id: "user-1", name: "민수", email: "minsu@example.com" },
        { id: "user-2", name: "영희", email: "yonghee@example.com" },
      ],
    };
    workspaceStore.setState((state) => {
      const nextWorkspaces = [...state.workspaces, newWorkspace];
      return {
        workspaces: nextWorkspaces,
        currentWorkspace:
          state.workspaces.length === 0 || isMain
            ? newWorkspace
            : state.currentWorkspace,
      };
    });
    return id;
  },

  sendInvitation: (
    workspaceId: string,
    workspaceName: string,
    inviterEmail: string,
    inviteeEmail: string
  ) => {
    const newInvitation: WorkspaceInvitation = {
      id: `inv-${Date.now()}`,
      workspaceId,
      workspaceName,
      inviterEmail,
      inviteeEmail,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    workspaceStore.setState((state) => ({
      invitations: [...state.invitations, newInvitation],
    }));
  },

  respondToInvitation: (
    invitationId: string,
    status: "accepted" | "declined"
  ) => {
    const state = workspaceStore.getState();
    const invitation = state.invitations.find((i) => i.id === invitationId);
    if (!invitation) return;

    workspaceStore.setState((s) => ({
      invitations: s.invitations.map((i) =>
        i.id === invitationId ? { ...i, status } : i
      ),
    }));

    if (status === "accepted") {
      const newWorkspace: Workspace = {
        id: invitation.workspaceId,
        name: invitation.workspaceName,
        type: "couple",
      };
      workspaceStore.setState((s) => ({
        workspaces: [...s.workspaces, newWorkspace],
        currentWorkspace: s.currentWorkspace || newWorkspace,
      }));
    }
  },

  removeWorkspace: (workspaceId: string) => {
    workspaceStore.setState((state) => {
      const nextWorkspaces = state.workspaces.filter(
        (ws) => ws.id !== workspaceId
      );
      const isRemovingCurrent = state.currentWorkspace?.id === workspaceId;
      return {
        workspaces: nextWorkspaces,
        currentWorkspace: isRemovingCurrent
          ? nextWorkspaces[0] || null
          : state.currentWorkspace,
      };
    });
  },

  updateWorkspaceName: (workspaceId: string, name: string) => {
    workspaceStore.setState((state) => {
      const nextWorkspaces = state.workspaces.map((ws) =>
        ws.id === workspaceId ? { ...ws, name } : ws
      );
      const isCurrent = state.currentWorkspace?.id === workspaceId;
      return {
        workspaces: nextWorkspaces,
        currentWorkspace: isCurrent
          ? { ...state.currentWorkspace!, name }
          : state.currentWorkspace,
      };
    });
  },

  updateWorkspaceStartDate: (workspaceId: string, startDate: string) => {
    workspaceStore.setState((state) => {
      const nextWorkspaces = state.workspaces.map((ws) =>
        ws.id === workspaceId ? { ...ws, startDate } : ws
      );
      const isCurrent = state.currentWorkspace?.id === workspaceId;
      return {
        workspaces: nextWorkspaces,
        currentWorkspace: isCurrent
          ? { ...state.currentWorkspace!, startDate }
          : state.currentWorkspace,
      };
    });
  },

  updateWorkspaceBackground: (workspaceId: string, imageUrl: string) => {
    workspaceStore.setState((state) => {
      const nextWorkspaces = state.workspaces.map((ws) =>
        ws.id === workspaceId ? { ...ws, backgroundImage: imageUrl } : ws
      );
      const isCurrent = state.currentWorkspace?.id === workspaceId;
      return {
        workspaces: nextWorkspaces,
        currentWorkspace: isCurrent
          ? { ...state.currentWorkspace!, backgroundImage: imageUrl }
          : state.currentWorkspace,
      };
    });
  },

  updateMemberProfile: (
    workspaceId: string,
    memberId: string,
    updates: { name?: string; avatar?: string }
  ) => {
    workspaceStore.setState((state) => {
      const updateMembers = (members: Workspace["members"]) =>
        members?.map((m) => (m.id === memberId ? { ...m, ...updates } : m));
      const nextWorkspaces = state.workspaces.map((ws) =>
        ws.id === workspaceId
          ? { ...ws, members: updateMembers(ws.members) }
          : ws
      );
      const isCurrent = state.currentWorkspace?.id === workspaceId;
      return {
        workspaces: nextWorkspaces,
        currentWorkspace: isCurrent
          ? { ...state.currentWorkspace!, members: updateMembers(state.currentWorkspace!.members) }
          : state.currentWorkspace,
      };
    });
  },

  initMockData: () => {
    const workspaceWithBg = { ...MOCK_DATA.workspace };
    workspaceStore.setState({
      currentWorkspace: workspaceWithBg,
      workspaces: [workspaceWithBg, ...MOCK_DATA.extraWorkspaces],
      invitations: [],
    });
  },

  clearData: () => {
    workspaceStore.setState({
      currentWorkspace: null,
      workspaces: [],
      invitations: [],
    });
  },
};

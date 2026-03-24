export interface User {
  id: string;
  name: string;
  email?: string;
  profileImage?: string;
  status?: string;
  location?: string;
  lastActive?: string;
}

export interface UserProfile {
  name: string;
  profileImage?: string;
}

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Workspace {
  id: string;
  name: string;
  type: "couple" | "group";
  startDate?: string;
  backgroundImage?: string;
  partnerName?: string;
  members?: WorkspaceMember[];
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  inviterEmail: string;
  inviteeEmail: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface Story {
  id: string;
  title: string;
  description?: string;
  date: string;
  path: LocationPoint[];
  pathColor: string;
  thumbnailUrl?: string;
  userId: string;
  workspaceId: string;
}

export interface Todo {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  assigneeId?: string;
  startDate: string;
  endDate: string;
  color?: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  color: string;
  createdAt: string;
}

export type CreateEventData = Omit<CalendarEvent, "id" | "createdAt">;

export interface ChatMessage {
  id: string;
  text: string;
  sender: "me" | "partner";
  time: string;
}

export interface ModalConfig {
  type: "alert" | "confirm";
  title: string;
  message?: string;
  content?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export type ToastType = "success" | "error" | "info" | "warning";

export interface UserLocation {
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

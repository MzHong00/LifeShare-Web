"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface UserState {
  user: User | null;
}

const userStore = create<UserState>()(
  persist(
    (): UserState => ({
      user: {
        id: "user-1",
        name: "민수",
        email: "minsu@example.com",
        profileImage:
          "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop",
      },
    }),
    { name: "user-storage" }
  )
);

export const useUserStore = <T = UserState>(
  selector: (state: UserState) => T = (state) => state as unknown as T
) => userStore(selector);

export const userActions = {
  updateUser: (updates: Partial<User>) =>
    userStore.setState((state) => ({
      user: state.user ? { ...state.user, ...updates } : state.user,
    })),
  clearUser: () => userStore.setState({ user: null }),
};

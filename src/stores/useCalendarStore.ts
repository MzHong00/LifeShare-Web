"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CalendarEvent, CreateEventData } from "@/types";

interface CalendarState {
  events: CalendarEvent[];
}

const calendarStore = create<CalendarState>()(
  persist(
    (): CalendarState => ({ events: [] }),
    { name: "calendar-storage" }
  )
);

export const useCalendarStore = <T = CalendarState>(
  selector: (state: CalendarState) => T = (state) => state as unknown as T
) => calendarStore(selector);

export const calendarActions = {
  addEvent: (eventData: CreateEventData) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `event-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    calendarStore.setState((state) => ({
      events: [newEvent, ...state.events],
    }));
  },
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => {
    calendarStore.setState((state) => ({
      events: state.events.map((event) =>
        event.id === id ? { ...event, ...updates } : event
      ),
    }));
  },
  removeEvent: (id: string) => {
    calendarStore.setState((state) => ({
      events: state.events.filter((event) => event.id !== id),
    }));
  },
  clearEvents: () => calendarStore.setState({ events: [] }),
};

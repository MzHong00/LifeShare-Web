"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Todo } from "@/types";
import { getISOTimestamp } from "@/utils/date";

interface TodoState {
  todos: Todo[];
}

const todoStore = create<TodoState>()(
  persist(
    (): TodoState => ({ todos: [] }),
    { name: "todo-storage" }
  )
);

export const useTodoStore = <T = TodoState>(
  selector: (state: TodoState) => T = (state) => state as unknown as T
) => todoStore(selector);

export const todoActions = {
  addTodo: (todoData: Omit<Todo, "id" | "createdAt">) => {
    const newTodo: Todo = {
      ...todoData,
      id: `todo-${Date.now()}`,
      createdAt: getISOTimestamp(),
    };
    todoStore.setState((state) => ({
      todos: [newTodo, ...state.todos],
    }));
  },
  updateTodo: (id: string, updates: Partial<Todo>) => {
    todoStore.setState((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, ...updates } : todo
      ),
    }));
  },
  toggleTodo: (id: string) => {
    todoStore.setState((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
      ),
    }));
  },
  removeTodo: (id: string) => {
    todoStore.setState((state) => ({
      todos: state.todos.filter((todo) => todo.id !== id),
    }));
  },
  clearTodos: () => todoStore.setState({ todos: [] }),
};

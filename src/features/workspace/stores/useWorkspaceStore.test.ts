import { renderHook } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COOKIE_KEYS } from "@/constants/config";
import { useWorkspaceStore, workspaceActions } from "./useWorkspaceStore";

const PERSIST_KEY = "workspace-storage";

/** 현재 문서 쿠키에서 워크스페이스 쿠키 값을 읽는다 (없으면 null) */
const readWorkspaceCookie = () =>
  document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${COOKIE_KEYS.WORKSPACE_ID}=`))
    ?.split("=")[1] ?? null;

describe("useWorkspaceStore", () => {
  beforeEach(() => {
    workspaceActions.clearData();
    document.cookie = `${COOKIE_KEYS.WORKSPACE_ID}=; path=/; max-age=0`;
    localStorage.clear();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("초기 상태의 currentWorkspaceId는 null을 반환한다", () => {
    const { result } = renderHook(() => useWorkspaceStore((state) => state.currentWorkspaceId));

    expect(result.current).toBeNull();
  });

  it("setCurrentWorkspaceId가 상태를 갱신한다", () => {
    const { result } = renderHook(() => useWorkspaceStore((state) => state.currentWorkspaceId));

    act(() => workspaceActions.setCurrentWorkspaceId("ws-1"));

    expect(result.current).toBe("ws-1");
  });

  it("setCurrentWorkspaceId가 null이면 현재 워크스페이스가 해제된다", () => {
    const { result } = renderHook(() => useWorkspaceStore((state) => state.currentWorkspaceId));

    act(() => workspaceActions.setCurrentWorkspaceId("ws-1"));
    act(() => workspaceActions.setCurrentWorkspaceId(null));

    expect(result.current).toBeNull();
  });

  it("clearData가 현재 워크스페이스를 초기화한다", () => {
    const { result } = renderHook(() => useWorkspaceStore((state) => state.currentWorkspaceId));

    act(() => workspaceActions.setCurrentWorkspaceId("ws-2"));
    act(() => workspaceActions.clearData());

    expect(result.current).toBeNull();
  });

  it("currentWorkspaceId가 설정되면 워크스페이스 쿠키에 동기화한다", () => {
    workspaceActions.setCurrentWorkspaceId("ws-3");

    expect(readWorkspaceCookie()).toBe("ws-3");
  });

  it("currentWorkspaceId가 null이 되면 워크스페이스 쿠키를 만료시킨다", () => {
    workspaceActions.setCurrentWorkspaceId("ws-4");
    workspaceActions.setCurrentWorkspaceId(null);

    expect(readWorkspaceCookie()).toBeNull();
  });

  it("같은 값으로 다시 설정하면 쿠키를 다시 쓰지 않는다", () => {
    workspaceActions.setCurrentWorkspaceId("ws-5");
    document.cookie = `${COOKIE_KEYS.WORKSPACE_ID}=; path=/; max-age=0`;

    workspaceActions.setCurrentWorkspaceId("ws-5");

    expect(readWorkspaceCookie()).toBeNull();
  });

  it("셀렉터로 구독하면 선택한 값만 반환한다", () => {
    workspaceActions.setCurrentWorkspaceId("ws-6");

    const { result } = renderHook(() =>
      useWorkspaceStore((state) => state.currentWorkspaceId === "ws-6")
    );

    expect(result.current).toBe(true);
  });

  it("셀렉터 결과가 바뀌지 않으면 리렌더하지 않는다", () => {
    const renderSpy = vi.fn();

    renderHook(() => {
      renderSpy();
      return useWorkspaceStore((state) => state.currentWorkspaceId === null);
    });
    const renderCountBefore = renderSpy.mock.calls.length;

    act(() => workspaceActions.setCurrentWorkspaceId(null));

    expect(renderSpy.mock.calls.length).toBe(renderCountBefore);
  });

  it("동일 버전으로 저장된 상태를 스토리지에서 복원한다", async () => {
    localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({ state: { currentWorkspaceId: "ws-persisted" }, version: 2 })
    );
    vi.resetModules();

    const { useWorkspaceStore: freshStore } = await import("./useWorkspaceStore");
    const { result } = renderHook(() => freshStore((state) => state.currentWorkspaceId));

    expect(result.current).toBe("ws-persisted");
  });

  it("이전 버전으로 저장된 상태는 마이그레이션되어 초기화된다", async () => {
    localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({ state: { currentWorkspaceId: "ws-legacy" }, version: 1 })
    );
    vi.resetModules();

    const { useWorkspaceStore: freshStore } = await import("./useWorkspaceStore");
    const { result } = renderHook(() => freshStore((state) => state.currentWorkspaceId));

    expect(result.current).toBeNull();
  });

  it("상태 변경이 스토리지에 저장된다", () => {
    workspaceActions.setCurrentWorkspaceId("ws-7");

    const persisted = localStorage.getItem(PERSIST_KEY);

    expect(persisted).not.toBeNull();
    expect(
      (JSON.parse(persisted as string) as { state: { currentWorkspaceId: string | null } }).state
        .currentWorkspaceId
    ).toBe("ws-7");
  });
});

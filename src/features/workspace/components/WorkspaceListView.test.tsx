import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { ROUTES } from "@/constants/routes";
import { WorkspaceListView } from "./WorkspaceListView";

import type { Workspace } from "@/features/workspace/types/workspace";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/features/workspace/hooks/useCurrentWorkspace", () => ({
  useCurrentWorkspace: vi.fn(),
}));

vi.mock("@/components/layout/AppHeader", () => ({
  AppHeader: () => <header />,
}));

const mockUseRouter = vi.mocked(useRouter);
const mockUseCurrentWorkspace = vi.mocked(useCurrentWorkspace);

const workspace = {
  id: "workspace-1",
  name: "우리집",
  type: "couple",
  startDate: "2026-01-01",
  themeColor: "pink",
  members: [
    { id: "user-1", name: "홍길동", email: "me@test.com", role: "owner" },
    { id: "user-2", name: "파트너", email: "partner@test.com", role: "member" },
  ],
} as unknown as Workspace;

/** useCurrentWorkspace 반환값을 원하는 상태로 세팅한다 */
const setWorkspaceState = (state: {
  workspaces?: Workspace[];
  currentWorkspace?: Workspace | null;
  isPending?: boolean;
  isError?: boolean;
}) => {
  mockUseCurrentWorkspace.mockReturnValue({
    workspaces: state.workspaces ?? [],
    currentWorkspace: state.currentWorkspace ?? null,
    isPending: state.isPending ?? false,
    isError: state.isError ?? false,
  } as unknown as ReturnType<typeof useCurrentWorkspace>);
};

describe("WorkspaceListView", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
  });

  it("로딩 중이면 목록 대신 스켈레톤을 렌더링한다", () => {
    setWorkspaceState({ isPending: true });

    render(<WorkspaceListView />);

    expect(screen.queryByText("우리집")).not.toBeInTheDocument();
    expect(screen.queryByText("참여 중인 라이프룸이 없습니다.")).not.toBeInTheDocument();
  });

  it("조회 실패 시 에러 안내를 렌더링한다", () => {
    setWorkspaceState({ isError: true });

    render(<WorkspaceListView />);

    expect(screen.getByText("라이프룸 목록을 불러오지 못했습니다.")).toBeInTheDocument();
  });

  it("참여 중인 라이프룸이 없으면 빈 상태 안내를 렌더링한다", () => {
    setWorkspaceState({ workspaces: [] });

    render(<WorkspaceListView />);

    expect(screen.getByText("참여 중인 라이프룸이 없습니다.")).toBeInTheDocument();
  });

  it("라이프룸 이름과 멤버 수를 렌더링한다", () => {
    setWorkspaceState({ workspaces: [workspace] });

    render(<WorkspaceListView />);

    expect(screen.getByText("우리집")).toBeInTheDocument();
    expect(screen.getByText("멤버 2명")).toBeInTheDocument();
  });

  it("현재 라이프룸에는 메인 배지를 붙인다", () => {
    setWorkspaceState({ workspaces: [workspace], currentWorkspace: workspace });

    render(<WorkspaceListView />);

    expect(screen.getByText("메인")).toBeInTheDocument();
  });

  it("현재 라이프룸이 아니면 메인 배지를 붙이지 않는다", () => {
    setWorkspaceState({
      workspaces: [workspace],
      currentWorkspace: { ...workspace, id: "workspace-2" },
    });

    render(<WorkspaceListView />);

    expect(screen.queryByText("메인")).not.toBeInTheDocument();
  });

  it("카드를 클릭하면 해당 라이프룸 설정 화면으로 이동한다", () => {
    setWorkspaceState({ workspaces: [workspace] });

    render(<WorkspaceListView />);
    fireEvent.click(screen.getByText("우리집"));

    expect(mockPush).toHaveBeenCalledWith(
      ROUTES.WORKSPACE.EDIT.query({ workspaceId: "workspace-1" })
    );
  });

  it("만들기 버튼을 클릭하면 생성 화면으로 이동한다", () => {
    setWorkspaceState({ workspaces: [workspace] });

    render(<WorkspaceListView />);
    fireEvent.click(screen.getByText(/새.*만들기/));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.WORKSPACE.SETUP.path);
  });

  it("초대 코드로 참여하기를 클릭하면 코드 입력 화면으로 이동한다", () => {
    setWorkspaceState({ workspaces: [workspace] });

    render(<WorkspaceListView />);
    fireEvent.click(screen.getByText("초대 코드로 참여하기"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.WORKSPACE.JOIN.path);
  });

  it("시작일이 없는 라이프룸은 날짜 줄을 렌더링하지 않는다", () => {
    setWorkspaceState({ workspaces: [{ ...workspace, startDate: undefined }] });

    render(<WorkspaceListView />);

    expect(screen.queryByText(/시작/)).not.toBeInTheDocument();
  });
});

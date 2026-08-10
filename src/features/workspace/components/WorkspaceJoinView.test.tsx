import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter, useParams } from "next/navigation";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useQuery } from "@tanstack/react-query";

import { ROUTES } from "@/constants/routes";
import { workspaceQueries } from "@/features/workspace/queries/workspaceQueries";
import { workspaceActions } from "@/features/workspace/stores/useWorkspaceStore";
import { useJoinWorkspaceMutation } from "@/features/workspace/queries/workspaceMutations";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { WorkspaceJoinView } from "./WorkspaceJoinView";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/features/auth/queries/authQueries", () => ({
  authQueries: { user: () => ({ queryKey: ["auth", "user"] }) },
}));

vi.mock("@/features/workspace/queries/workspaceQueries", () => ({
  workspaceQueries: {
    byInviteCode: vi.fn((code: string) => ({ queryKey: ["workspaces", "by-invite-code", code] })),
  },
}));

vi.mock("@/features/workspace/queries/workspaceMutations", () => ({
  useJoinWorkspaceMutation: vi.fn(),
}));

vi.mock("@/features/workspace/hooks/useCurrentWorkspace", () => ({
  useCurrentWorkspace: vi.fn(),
}));

vi.mock("@/features/workspace/stores/useWorkspaceStore", () => ({
  workspaceActions: { setCurrentWorkspaceId: vi.fn() },
}));

const mockUseQuery = vi.mocked(useQuery);
const mockByInviteCode = vi.mocked(workspaceQueries.byInviteCode);

type LookupState = {
  workspace?: { id: string; name: string } | null;
  isPending?: boolean;
  error?: Error | null;
};

describe("WorkspaceJoinView", () => {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();
  const mutateAsync = vi.fn();

  /** 로그인 사용자와 초대 코드 조회 결과를 queryKey 기준으로 분기해 세팅한다 */
  const setQueries = (
    user: { id: string } | null,
    { workspace = null, isPending = false, error = null }: LookupState
  ) => {
    mockUseQuery.mockImplementation((options) => {
      const [, scope] = (options as { queryKey: readonly string[] }).queryKey;
      if (scope === "user") return { data: user } as unknown as ReturnType<typeof useQuery>;
      return { data: workspace, isPending, error } as unknown as ReturnType<typeof useQuery>;
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockByInviteCode.mockImplementation(
      (code: string) =>
        ({ queryKey: ["workspaces", "by-invite-code", code] }) as unknown as ReturnType<
          typeof workspaceQueries.byInviteCode
        >
    );
    vi.mocked(useParams).mockReturnValue({ code: "K7M2P9QX" });
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useCurrentWorkspace).mockReturnValue({
      workspaces: [],
    } as unknown as ReturnType<typeof useCurrentWorkspace>);
    vi.mocked(useJoinWorkspaceMutation).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useJoinWorkspaceMutation>);
  });

  it("조회 중에는 초대 확인 중 상태 텍스트를 렌더링한다", () => {
    setQueries(null, { isPending: true });

    render(<WorkspaceJoinView />);

    expect(screen.getByText("초대 확인 중...")).toBeInTheDocument();
  });

  it("조회 성공 시 라이프룸 이름과 초대 안내 문구를 렌더링한다", () => {
    setQueries({ id: "user-1" }, { workspace: { id: "ws-1", name: "우리집" } });

    render(<WorkspaceJoinView />);

    expect(screen.getByText("우리집")).toBeInTheDocument();
    expect(screen.getByText(/초대받았습니다/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "참여하기" })).toBeInTheDocument();
  });

  it("미로그인이면 버튼 라벨이 로그인 후 참여하기이고 클릭 시 redirect 쿼리를 담아 로그인으로 이동한다", () => {
    setQueries(null, { workspace: { id: "ws-1", name: "우리집" } });

    render(<WorkspaceJoinView />);
    fireEvent.click(screen.getByRole("button", { name: "로그인 후 참여하기" }));

    expect(mockPush).toHaveBeenCalledWith(
      ROUTES.LOGIN.query({ redirect: ROUTES.WORKSPACE.join("K7M2P9QX") })
    );
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("로그인 상태에서 참여 성공 시 현재 라이프룸으로 설정하고 홈으로 이동한다", async () => {
    setQueries({ id: "user-1" }, { workspace: { id: "ws-1", name: "우리집" } });
    mutateAsync.mockResolvedValueOnce({ id: "ws-1" });

    render(<WorkspaceJoinView />);
    fireEvent.click(screen.getByRole("button", { name: "참여하기" }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ workspaceId: "ws-1", inviteCode: "K7M2P9QX" })
    );
    expect(workspaceActions.setCurrentWorkspaceId).toHaveBeenCalledWith("ws-1");
    expect(mockReplace).toHaveBeenCalledWith(ROUTES.HOME.path);
  });

  it("참여 실패 시 서버 에러 메시지를 노출한다", async () => {
    setQueries({ id: "user-1" }, { workspace: { id: "ws-1", name: "우리집" } });
    mutateAsync.mockRejectedValueOnce(new Error("이미 정원이 찼습니다."));

    render(<WorkspaceJoinView />);
    fireEvent.click(screen.getByRole("button", { name: "참여하기" }));

    expect(await screen.findByText("이미 정원이 찼습니다.")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("이미 참여 중인 라이프룸이면 이미 참여 중 안내와 전환 버튼을 렌더링한다", () => {
    setQueries({ id: "user-1" }, { workspace: { id: "ws-1", name: "우리집" } });
    vi.mocked(useCurrentWorkspace).mockReturnValue({
      workspaces: [{ id: "ws-1" }],
    } as unknown as ReturnType<typeof useCurrentWorkspace>);

    render(<WorkspaceJoinView />);

    expect(screen.getByText(/이미 참여 중인/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /으로 이동/ }));

    expect(workspaceActions.setCurrentWorkspaceId).toHaveBeenCalledWith("ws-1");
    expect(mockReplace).toHaveBeenCalledWith(ROUTES.HOME.path);
  });

  it("조회 실패 시 서버 메시지와 코드 직접 입력하기·홈으로 돌아가기 버튼을 렌더링한다", () => {
    setQueries(null, { error: new Error("만료된 초대 코드입니다.") });

    render(<WorkspaceJoinView />);

    expect(screen.getByText("만료된 초대 코드입니다.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "코드 직접 입력하기" }));
    expect(mockReplace).toHaveBeenCalledWith(ROUTES.WORKSPACE.JOIN.path);

    fireEvent.click(screen.getByRole("button", { name: "홈으로 돌아가기" }));
    expect(mockReplace).toHaveBeenCalledWith(ROUTES.HOME.path);
  });

  it("링크의 코드가 소문자·하이픈을 포함해도 정규화되어 조회에 쓰인다", () => {
    vi.mocked(useParams).mockReturnValue({ code: "k7m2-p9qx" });
    setQueries({ id: "user-1" }, { workspace: { id: "ws-1", name: "우리집" } });

    render(<WorkspaceJoinView />);

    expect(mockByInviteCode).toHaveBeenCalledWith("K7M2P9QX");
  });
});

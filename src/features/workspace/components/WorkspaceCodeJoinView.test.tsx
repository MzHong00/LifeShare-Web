import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ROUTES } from "@/constants/routes";
import { workspaceActions } from "@/features/workspace/stores/useWorkspaceStore";
import { workspaceQueries } from "@/features/workspace/queries/workspaceQueries";
import { useJoinWorkspaceMutation } from "@/features/workspace/queries/workspaceMutations";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { WorkspaceCodeJoinView } from "./WorkspaceCodeJoinView";

import type { WorkspaceInvitePreview } from "@/features/workspace/types/workspace";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/features/auth/queries/authQueries", () => ({
  authQueries: { user: () => ({ queryKey: ["auth", "user"] }) },
}));

vi.mock("@/features/workspace/queries/workspaceQueries", () => ({
  workspaceQueries: {
    byInviteCode: vi.fn((code: string) => ({ queryKey: ["by-invite-code", code] })),
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

const VALID_CODE = "K7M2P9QX";
const PREVIEW: WorkspaceInvitePreview = {
  id: "ws-1",
  name: "우리집",
  type: "couple",
  memberCount: 2,
};

const mockUseQuery = vi.mocked(useQuery);
const mockUseRouter = vi.mocked(useRouter);
const mockByInviteCode = vi.mocked(workspaceQueries.byInviteCode);

describe("WorkspaceCodeJoinView", () => {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();
  const mockBack = vi.fn();
  const joinMutateAsync = vi.fn();

  let currentUser: { id: string } | null = { id: "user-1" };
  let lookupResult: { data?: WorkspaceInvitePreview; isFetching: boolean; error?: Error } = {
    data: PREVIEW,
    isFetching: false,
  };

  /** 두 개의 useQuery(사용자 / 초대 코드 조회)를 queryKey로 구분해 응답한다 */
  const setupUseQuery = () => {
    mockUseQuery.mockImplementation((options: unknown) => {
      const { queryKey } = options as { queryKey: [string, string?] };
      if (queryKey[0] === "auth") {
        return { data: currentUser } as unknown as ReturnType<typeof useQuery>;
      }
      // 코드를 확정하기 전(빈 코드)에는 조회 결과가 없다
      if (!queryKey[1]) {
        return { data: undefined, isFetching: false, error: null } as unknown as ReturnType<
          typeof useQuery
        >;
      }
      return {
        data: lookupResult.data,
        isFetching: lookupResult.isFetching,
        error: lookupResult.error ?? null,
      } as unknown as ReturnType<typeof useQuery>;
    });
  };

  /** 초대 코드를 입력하고 "코드 확인"을 눌러 조회를 확정한다 */
  const submitCode = (code: string) => {
    fireEvent.change(screen.getByLabelText("초대 코드"), { target: { value: code } });
    fireEvent.click(screen.getByRole("button", { name: "코드 확인" }));
  };

  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = { id: "user-1" };
    lookupResult = { data: PREVIEW, isFetching: false };
    setupUseQuery();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      back: mockBack,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useCurrentWorkspace).mockReturnValue({
      workspaces: [],
    } as unknown as ReturnType<typeof useCurrentWorkspace>);
    vi.mocked(useJoinWorkspaceMutation).mockReturnValue({
      mutateAsync: joinMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useJoinWorkspaceMutation>);
  });

  it("초대 코드 입력 시 대문자·하이픈 표기로 자동 정규화되어 표시된다", () => {
    render(<WorkspaceCodeJoinView />);
    const input = screen.getByLabelText("초대 코드");

    fireEvent.change(input, { target: { value: "k7m2p9qx" } });

    expect(input).toHaveValue("K7M2-P9QX");
  });

  it("형식이 잘못된 코드로 확인 시 서버 조회 없이 인라인 에러가 뜬다", () => {
    render(<WorkspaceCodeJoinView />);

    submitCode("K7M2");

    expect(screen.getByRole("alert")).toHaveTextContent("초대 코드 8자리를 정확히 입력해주세요.");
    expect(mockByInviteCode).not.toHaveBeenCalledWith(expect.stringMatching(/.+/));
  });

  it("유효한 코드 조회 성공 시 라이프룸 이름과 멤버 수 미리보기가 뜬다", () => {
    render(<WorkspaceCodeJoinView />);

    submitCode(VALID_CODE);

    expect(mockByInviteCode).toHaveBeenCalledWith(VALID_CODE);
    expect(screen.getByText("우리집")).toBeInTheDocument();
    expect(screen.getByText("멤버 2명")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "참여하기" })).toBeInTheDocument();
  });

  it("조회 실패 시 서버가 내려준 에러 메시지가 인라인으로 노출된다", () => {
    lookupResult = { data: undefined, isFetching: false, error: new Error("존재하지 않는 코드") };
    render(<WorkspaceCodeJoinView />);

    submitCode(VALID_CODE);

    expect(screen.getByRole("alert")).toHaveTextContent("존재하지 않는 코드");
  });

  it("미로그인 상태에서 참여 클릭 시 로그인 화면으로 리다이렉트된다", async () => {
    currentUser = null;
    render(<WorkspaceCodeJoinView />);

    submitCode(VALID_CODE);
    fireEvent.click(screen.getByRole("button", { name: "참여하기" }));

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        ROUTES.LOGIN.query({ redirect: ROUTES.WORKSPACE.JOIN.path })
      )
    );
    expect(joinMutateAsync).not.toHaveBeenCalled();
  });

  it("로그인 상태에서 참여 성공 시 현재 라이프룸으로 설정하고 홈으로 이동한다", async () => {
    joinMutateAsync.mockResolvedValueOnce({ id: "ws-1" });
    render(<WorkspaceCodeJoinView />);

    submitCode(VALID_CODE);
    fireEvent.click(screen.getByRole("button", { name: "참여하기" }));

    await waitFor(() =>
      expect(joinMutateAsync).toHaveBeenCalledWith({
        workspaceId: "ws-1",
        inviteCode: VALID_CODE,
      })
    );
    expect(workspaceActions.setCurrentWorkspaceId).toHaveBeenCalledWith("ws-1");
    expect(mockReplace).toHaveBeenCalledWith(ROUTES.HOME.path);
  });

  it("참여 실패 시 에러 메시지를 인라인으로 노출한다", async () => {
    joinMutateAsync.mockRejectedValueOnce(new Error("이미 정원이 찼습니다."));
    render(<WorkspaceCodeJoinView />);

    submitCode(VALID_CODE);
    fireEvent.click(screen.getByRole("button", { name: "참여하기" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("이미 정원이 찼습니다.")
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("이미 참여 중인 라이프룸이면 참여 대신 전환 버튼이 노출된다", () => {
    vi.mocked(useCurrentWorkspace).mockReturnValue({
      workspaces: [{ id: "ws-1" }],
    } as unknown as ReturnType<typeof useCurrentWorkspace>);
    render(<WorkspaceCodeJoinView />);

    submitCode(VALID_CODE);

    expect(screen.getByText("이미 참여 중인 라이프룸이에요.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "참여하기" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "이 라이프룸으로 이동" }));

    expect(workspaceActions.setCurrentWorkspaceId).toHaveBeenCalledWith("ws-1");
    expect(mockReplace).toHaveBeenCalledWith(ROUTES.HOME.path);
  });

  it("뒤로가기 버튼이 router.back을 호출한다", () => {
    render(<WorkspaceCodeJoinView />);

    fireEvent.click(screen.getAllByRole("button")[0]);

    expect(mockBack).toHaveBeenCalled();
  });
});

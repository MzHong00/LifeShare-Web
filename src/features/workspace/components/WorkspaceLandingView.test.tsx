import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { ROUTES } from "@/constants/routes";
import { WorkspaceLandingView } from "./WorkspaceLandingView";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/features/workspace/hooks/useCurrentWorkspace", () => ({
  useCurrentWorkspace: vi.fn(),
}));

const mockUseRouter = vi.mocked(useRouter);
const mockUseCurrentWorkspace = vi.mocked(useCurrentWorkspace);

describe("WorkspaceLandingView", () => {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();

  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    } as unknown as ReturnType<typeof useRouter>);
  });

  it("로딩 중이면 아무것도 렌더링하지 않는다", () => {
    mockUseCurrentWorkspace.mockReturnValue({
      workspaces: [],
      isPending: true,
      isError: false,
    } as unknown as ReturnType<typeof useCurrentWorkspace>);

    const { container } = render(<WorkspaceLandingView />);

    expect(container).toBeEmptyDOMElement();
  });

  it("참여 중인 워크스페이스가 있으면 홈으로 리다이렉트한다", () => {
    mockUseCurrentWorkspace.mockReturnValue({
      workspaces: [{ id: "ws-1" }],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCurrentWorkspace>);

    render(<WorkspaceLandingView />);

    expect(mockReplace).toHaveBeenCalledWith(ROUTES.HOME.path);
  });

  it("조회 실패 시 생성 CTA 대신 에러 안내 텍스트를 렌더링한다", () => {
    mockUseCurrentWorkspace.mockReturnValue({
      workspaces: [],
      isPending: false,
      isError: true,
    } as unknown as ReturnType<typeof useCurrentWorkspace>);

    render(<WorkspaceLandingView />);

    expect(screen.getByText("라이프룸 정보를 불러오지 못했습니다.")).toBeInTheDocument();
    expect(screen.queryByText(/새로운.*만들기/)).not.toBeInTheDocument();
  });

  it("워크스페이스가 없으면 생성 CTA와 초대 코드 입력을 렌더링한다", () => {
    mockUseCurrentWorkspace.mockReturnValue({
      workspaces: [],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCurrentWorkspace>);

    render(<WorkspaceLandingView />);

    expect(screen.getByPlaceholderText("초대 코드 입력")).toBeInTheDocument();
  });

  it("생성 CTA 클릭 시 워크스페이스 생성 화면으로 이동한다", () => {
    mockUseCurrentWorkspace.mockReturnValue({
      workspaces: [],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCurrentWorkspace>);

    render(<WorkspaceLandingView />);
    fireEvent.click(screen.getByText(/새로운.*만들기/));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.WORKSPACE.SETUP.path);
  });

  it("초대 코드를 입력하지 않으면 참여하기 버튼이 비활성화된다", () => {
    mockUseCurrentWorkspace.mockReturnValue({
      workspaces: [],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCurrentWorkspace>);

    render(<WorkspaceLandingView />);

    expect(screen.getByText("참여하기")).toBeDisabled();
  });

  it("초대 코드를 입력하고 참여하기를 클릭하면 참여 화면으로 이동한다", () => {
    mockUseCurrentWorkspace.mockReturnValue({
      workspaces: [],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCurrentWorkspace>);

    render(<WorkspaceLandingView />);
    fireEvent.change(screen.getByPlaceholderText("초대 코드 입력"), {
      target: { value: "CODE123" },
    });
    fireEvent.click(screen.getByText("참여하기"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.WORKSPACE.join("CODE123"));
  });
});

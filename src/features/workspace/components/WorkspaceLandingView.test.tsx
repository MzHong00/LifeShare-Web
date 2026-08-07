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

  it("워크스페이스가 없으면 생성 CTA와 초대 코드 참여 진입점을 렌더링한다", () => {
    mockUseCurrentWorkspace.mockReturnValue({
      workspaces: [],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCurrentWorkspace>);

    render(<WorkspaceLandingView />);

    expect(screen.getByText(/새로운.*만들기/)).toBeInTheDocument();
    expect(screen.getByText("초대 코드로 참여하기")).toBeInTheDocument();
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

  it("초대 코드로 참여하기 클릭 시 코드 입력 화면으로 이동한다", () => {
    mockUseCurrentWorkspace.mockReturnValue({
      workspaces: [],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCurrentWorkspace>);

    render(<WorkspaceLandingView />);
    fireEvent.click(screen.getByText("초대 코드로 참여하기"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.WORKSPACE.JOIN.path);
  });
});

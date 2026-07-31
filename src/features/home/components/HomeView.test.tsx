import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { ROUTES } from "@/constants/routes";
import { HomeView } from "./HomeView";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/features/workspace/hooks/useCurrentWorkspace", () => ({
  useCurrentWorkspace: vi.fn(),
}));

vi.mock("@/features/home/components/MemoryFeed", () => ({
  MemoryFeed: () => <div>메모리피드</div>,
}));

const mockUseRouter = vi.mocked(useRouter);
const mockUseCurrentWorkspace = vi.mocked(useCurrentWorkspace);

describe("HomeView", () => {
  const mockReplace = vi.fn();

  beforeEach(() => {
    mockReplace.mockClear();
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
    } as unknown as ReturnType<typeof useRouter>);
  });

  it("로딩 중이면 아무것도 렌더링하지 않는다", () => {
    mockUseCurrentWorkspace.mockReturnValue({
      currentWorkspace: undefined,
      isPending: true,
      isError: false,
    } as unknown as ReturnType<typeof useCurrentWorkspace>);

    const { container } = render(<HomeView />);

    expect(container).toBeEmptyDOMElement();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("조회 실패 시 에러 안내 텍스트를 렌더링하고 리다이렉트하지 않는다", () => {
    mockUseCurrentWorkspace.mockReturnValue({
      currentWorkspace: undefined,
      isPending: false,
      isError: true,
    } as unknown as ReturnType<typeof useCurrentWorkspace>);

    render(<HomeView />);

    expect(screen.getByText("라이프룸 정보를 불러오지 못했습니다.")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("워크스페이스가 없으면 워크스페이스 랜딩으로 리다이렉트한다", () => {
    mockUseCurrentWorkspace.mockReturnValue({
      currentWorkspace: undefined,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCurrentWorkspace>);

    render(<HomeView />);

    expect(mockReplace).toHaveBeenCalledWith(ROUTES.WORKSPACE.LANDING.path);
  });

  it("워크스페이스가 있으면 메모리피드를 렌더링한다", () => {
    mockUseCurrentWorkspace.mockReturnValue({
      currentWorkspace: { id: "ws-1", name: "워크스페이스1" },
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCurrentWorkspace>);

    render(<HomeView />);

    expect(screen.getByText("메모리피드")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

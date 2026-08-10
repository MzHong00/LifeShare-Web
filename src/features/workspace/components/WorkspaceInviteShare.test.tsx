import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { useInviteShare } from "@/features/workspace/hooks/useInviteShare";
import { WorkspaceInviteShare } from "./WorkspaceInviteShare";

vi.mock("@/features/workspace/hooks/useInviteShare", () => ({
  useInviteShare: vi.fn(),
}));

const mockUseInviteShare = vi.mocked(useInviteShare);

describe("WorkspaceInviteShare", () => {
  const copyCode = vi.fn();
  const copyLink = vi.fn();
  const regenerate = vi.fn();

  /** 훅 반환값을 부분 지정해 세팅한다 */
  const setShare = (overrides: Partial<ReturnType<typeof useInviteShare>> = {}) => {
    mockUseInviteShare.mockReturnValue({
      code: "K7M2P9QX",
      displayCode: "K7M2-P9QX",
      isPending: false,
      isRegenerating: false,
      copyCode,
      copyLink,
      regenerate,
      ...overrides,
    } as unknown as ReturnType<typeof useInviteShare>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setShare();
  });

  it("코드 로딩 중에는 불러오는 중 문구를 표시한다", () => {
    setShare({ isPending: true, code: undefined, displayCode: "" });

    render(<WorkspaceInviteShare workspaceId="workspace-1" />);

    expect(screen.getByText("불러오는 중...")).toBeInTheDocument();
    expect(screen.queryByText("발급된 코드가 없습니다")).not.toBeInTheDocument();
  });

  it("발급된 코드가 없으면 안내 문구를 표시하고 복사 버튼을 비활성화한다", () => {
    setShare({ code: null, displayCode: "" });

    render(<WorkspaceInviteShare workspaceId="workspace-1" />);

    expect(screen.getByText("발급된 코드가 없습니다")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "코드 복사" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "링크 복사" })).toBeDisabled();
  });

  it("코드가 있으면 하이픈 표기로 표시한다", () => {
    render(<WorkspaceInviteShare workspaceId="workspace-1" />);

    expect(screen.getByText("K7M2-P9QX")).toBeInTheDocument();
  });

  it("코드 복사 버튼 클릭 시 copyCode를 호출한다", () => {
    render(<WorkspaceInviteShare workspaceId="workspace-1" />);
    fireEvent.click(screen.getByRole("button", { name: "코드 복사" }));

    expect(copyCode).toHaveBeenCalledTimes(1);
  });

  it("링크 복사 버튼 클릭 시 copyLink를 호출한다", () => {
    render(<WorkspaceInviteShare workspaceId="workspace-1" />);
    fireEvent.click(screen.getByRole("button", { name: "링크 복사" }));

    expect(copyLink).toHaveBeenCalledTimes(1);
  });

  it("재발급 버튼 클릭 시 regenerate를 호출한다", () => {
    render(<WorkspaceInviteShare workspaceId="workspace-1" />);
    fireEvent.click(screen.getByRole("button", { name: "코드 재발급" }));

    expect(regenerate).toHaveBeenCalledTimes(1);
  });

  it("코드가 없으면 버튼 라벨이 코드 발급이다", () => {
    setShare({ code: null, displayCode: "" });

    render(<WorkspaceInviteShare workspaceId="workspace-1" />);

    expect(screen.getByRole("button", { name: "코드 발급" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "코드 재발급" })).not.toBeInTheDocument();
  });

  it("재발급 진행 중에는 재발급 버튼을 비활성화한다", () => {
    setShare({ isRegenerating: true });

    render(<WorkspaceInviteShare workspaceId="workspace-1" />);

    expect(screen.getByRole("button", { name: "코드 재발급" })).toBeDisabled();
  });
});

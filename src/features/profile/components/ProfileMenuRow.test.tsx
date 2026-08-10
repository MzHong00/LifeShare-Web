import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ProfileMenuRow } from "./ProfileMenuRow";

import type { ProfileMenuItem } from "@/features/profile/constants/profileMenu";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

const mockUseRouter = vi.mocked(useRouter);

const buildItem = (overrides?: Partial<ProfileMenuItem>): ProfileMenuItem => ({
  id: "privacy",
  label: "개인정보 처리방침",
  subText: "약관 및 정책",
  route: "/profile/privacy",
  icon: <svg data-testid="menu-icon" />,
  colorClass: "grey",
  ...overrides,
});

describe("ProfileMenuRow", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
  });

  it("라벨·우측 보조 텍스트·아이콘을 렌더링한다", () => {
    render(<ProfileMenuRow item={buildItem()} />);

    expect(screen.getByText("개인정보 처리방침")).toBeInTheDocument();
    expect(screen.getByText("약관 및 정책")).toBeInTheDocument();
    expect(screen.getByTestId("menu-icon")).toBeInTheDocument();
  });

  it("route만 있으면 클릭 시 해당 경로로 이동한다", () => {
    render(<ProfileMenuRow item={buildItem()} />);
    fireEvent.click(screen.getByRole("button"));

    expect(mockPush).toHaveBeenCalledWith("/profile/privacy");
  });

  it("onClick이 있으면 라우팅 대신 onClick을 실행한다", () => {
    const onClick = vi.fn();

    render(<ProfileMenuRow item={buildItem({ onClick })} />);
    fireEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("route와 onClick이 모두 없으면 빈 경로로 이동을 시도한다", () => {
    render(<ProfileMenuRow item={buildItem({ route: undefined })} />);
    fireEvent.click(screen.getByRole("button"));

    expect(mockPush).toHaveBeenCalledWith("");
  });
});

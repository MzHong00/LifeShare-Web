import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import { ROUTES } from "@/constants/routes";

import { BottomNav } from "./BottomNav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

const mockUsePathname = vi.mocked(usePathname);

// jsdom에는 ResizeObserver가 없으므로 BottomNav의 높이 측정 로직을 위해 모킹
class MockResizeObserver {
  observe() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", MockResizeObserver);

describe("BottomNav", () => {
  it("GNB 대상 경로가 아니면 아무것도 렌더링하지 않는다", () => {
    mockUsePathname.mockReturnValue(ROUTES.PROFILE.SETTINGS.path);
    const { container } = render(<BottomNav />);

    expect(container).toBeEmptyDOMElement();
  });

  it("GNB 대상 경로면 모든 네비게이션 항목을 렌더링한다", () => {
    mockUsePathname.mockReturnValue(ROUTES.HOME.path);
    render(<BottomNav />);

    expect(screen.getByText("홈")).toBeInTheDocument();
    expect(screen.getByText("채팅")).toBeInTheDocument();
    expect(screen.getByText("스토리")).toBeInTheDocument();
    expect(screen.getByText("위치")).toBeInTheDocument();
    expect(screen.getByText("프로필")).toBeInTheDocument();
  });

  it("각 네비게이션 항목은 해당 경로로 링크된다", () => {
    mockUsePathname.mockReturnValue(ROUTES.HOME.path);
    render(<BottomNav />);

    expect(screen.getByText("홈").closest("a")).toHaveAttribute("href", ROUTES.HOME.path);
    expect(screen.getByText("채팅").closest("a")).toHaveAttribute("href", ROUTES.CHAT.path);
  });

  it("현재 경로와 정확히 일치하는 항목을 active 처리한다", () => {
    mockUsePathname.mockReturnValue(ROUTES.CHAT.path);
    render(<BottomNav />);

    const activeLabel = screen.getByText("채팅");
    const inactiveLabel = screen.getByText("홈");

    expect(activeLabel.className).toMatch(/navLabelActive/);
    expect(inactiveLabel.className).not.toMatch(/navLabelActive/);
  });

  it("GNB 항목과 정확히 일치하지 않는 하위 경로면 렌더링하지 않는다", () => {
    mockUsePathname.mockReturnValue(ROUTES.STORIES.LIST.path);
    const { container } = render(<BottomNav />);

    expect(container).toBeEmptyDOMElement();
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { AppHeader } from "./AppHeader";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

const mockUseRouter = vi.mocked(useRouter);

describe("AppHeader", () => {
  const mockBack = vi.fn();

  beforeEach(() => {
    mockBack.mockClear();
    mockUseRouter.mockReturnValue({
      back: mockBack,
    } as unknown as ReturnType<typeof useRouter>);
  });

  it("isBackVisible이 기본값(true)이면 뒤로가기 버튼을 렌더링한다", () => {
    render(<AppHeader />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("isBackVisible이 false면 뒤로가기 버튼 대신 placeholder를 렌더링한다", () => {
    render(<AppHeader isBackVisible={false} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("title이 없으면 제목을 렌더링하지 않는다", () => {
    const { container } = render(<AppHeader title={undefined} />);

    expect(container.querySelector("h1")).not.toBeInTheDocument();
  });

  it("title이 있으면 제목을 렌더링한다", () => {
    render(<AppHeader title="제목" />);

    expect(screen.getByText("제목")).toBeInTheDocument();
  });

  it("onBack이 없으면 뒤로가기 버튼 클릭 시 router.back()을 호출한다", () => {
    render(<AppHeader />);
    fireEvent.click(screen.getByRole("button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("onBack이 있으면 뒤로가기 버튼 클릭 시 onBack을 호출하고 router.back()은 호출하지 않는다", () => {
    const onBack = vi.fn();
    render(<AppHeader onBack={onBack} />);
    fireEvent.click(screen.getByRole("button"));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("rightElement를 전달하면 렌더링한다", () => {
    render(<AppHeader rightElement={<span>액션</span>} />);

    expect(screen.getByText("액션")).toBeInTheDocument();
  });
});

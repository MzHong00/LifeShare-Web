import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { ROUTES } from "@/constants/routes";
import { useAnniversaries } from "@/features/anniversary/hooks/useAnniversaries";
import { AnniversarySpotlight } from "./AnniversarySpotlight";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/features/anniversary/hooks/useAnniversaries", () => ({
  useAnniversaries: vi.fn(),
}));

const mockUseRouter = vi.mocked(useRouter);
const mockUseAnniversaries = vi.mocked(useAnniversaries);

const FIXED_NOW = new Date("2026-08-03T09:00:00Z"); // D-day 계산 결과 고정용 기준 시각

/** useAnniversaries 반환값을 원하는 상태로 세팅한다 */
const setAnniversariesState = (state: { startDate?: string; days?: number }) => {
  mockUseAnniversaries.mockReturnValue({
    startDate: state.startDate,
    days: state.days ?? 0,
    anniversaries: [],
    previousAnniversary: null,
  } as unknown as ReturnType<typeof useAnniversaries>);
};

describe("AnniversarySpotlight", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    mockUseRouter.mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("시작일이 없으면 아무것도 렌더링하지 않는다", () => {
    setAnniversariesState({ startDate: undefined });

    const { container } = render(<AnniversarySpotlight />);

    expect(container).toBeEmptyDOMElement();
  });

  it("함께한 일수와 시작일을 렌더링한다", () => {
    setAnniversariesState({ startDate: "2026-01-01", days: 215 });

    render(<AnniversarySpotlight />);

    expect(screen.getByText("215일")).toBeInTheDocument();
    expect(screen.getByText("2026. 01. 01 (목)부터")).toBeInTheDocument();
  });

  it("함께한 일수를 접근성 라벨에 반영한다", () => {
    setAnniversariesState({ startDate: "2026-01-01", days: 215 });

    render(<AnniversarySpotlight />);

    expect(
      screen.getByRole("button", { name: "함께한 지 215일, 기념일 페이지로 이동" })
    ).toBeInTheDocument();
  });

  it("폴라로이드를 클릭하면 기념일 페이지로 이동한다", () => {
    setAnniversariesState({ startDate: "2026-01-01", days: 215 });

    render(<AnniversarySpotlight />);
    fireEvent.click(screen.getByRole("button"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.ANNIVERSARY.path);
  });
});

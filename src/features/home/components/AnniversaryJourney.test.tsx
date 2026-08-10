import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { ROUTES } from "@/constants/routes";
import { useAnniversaries } from "@/features/anniversary/hooks/useAnniversaries";
import { AnniversaryJourney } from "./AnniversaryJourney";

import type { Anniversary } from "@/features/anniversary/types/anniversary";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/features/anniversary/hooks/useAnniversaries", () => ({
  useAnniversaries: vi.fn(),
}));

const mockUseRouter = vi.mocked(useRouter);
const mockUseAnniversaries = vi.mocked(useAnniversaries);

const FIXED_NOW = new Date("2026-08-03T09:00:00Z"); // D-day 계산 결과 고정용 기준 시각

const anniversaries = [
  { id: "d-300", title: "300일", date: "2026-10-26", daysLeft: 84 },
  { id: "y-1", title: "1주년 기념일", date: "2027-01-01", daysLeft: 151 },
  { id: "d-500", title: "500일", date: "2027-05-14", daysLeft: 284 },
] as unknown as Anniversary[];

/** useAnniversaries 반환값을 원하는 상태로 세팅한다 */
const setAnniversariesState = (state: {
  anniversaries?: Anniversary[];
  days?: number;
  previousAnniversary?: Anniversary | null;
}) => {
  mockUseAnniversaries.mockReturnValue({
    startDate: "2026-01-01",
    days: state.days ?? 215,
    anniversaries: state.anniversaries ?? anniversaries,
    previousAnniversary: state.previousAnniversary ?? null,
  } as unknown as ReturnType<typeof useAnniversaries>);
};

describe("AnniversaryJourney", () => {
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

  it("다가오는 기념일이 없으면 아무것도 렌더링하지 않는다", () => {
    setAnniversariesState({ anniversaries: [] });

    const { container } = render(<AnniversaryJourney />);

    expect(container).toBeEmptyDOMElement();
  });

  it("다가오는 기념일 정거장의 제목과 D-day를 렌더링한다", () => {
    setAnniversariesState({});

    render(<AnniversaryJourney />);

    expect(screen.getByText("300일")).toBeInTheDocument();
    expect(screen.getByText("D-84")).toBeInTheDocument();
    expect(screen.getByText("1주년 기념일")).toBeInTheDocument();
    expect(screen.getByText("D-151")).toBeInTheDocument();
  });

  it("정거장은 최대 3개까지만 렌더링한다", () => {
    setAnniversariesState({
      anniversaries: [
        ...anniversaries,
        { id: "y-2", title: "2주년 기념일", date: "2028-01-01", daysLeft: 516 },
      ] as unknown as Anniversary[],
    });

    render(<AnniversaryJourney />);

    expect(screen.getByText("500일")).toBeInTheDocument();
    expect(screen.queryByText("2주년 기념일")).not.toBeInTheDocument();
  });

  it("당일 기념일은 D-Day로 표시한다", () => {
    setAnniversariesState({
      anniversaries: [{ id: "d-300", title: "300일", date: "2026-08-03", daysLeft: 0 }],
    });

    render(<AnniversaryJourney />);

    expect(screen.getByText("D-Day")).toBeInTheDocument();
  });

  it("지난 기념일이 없으면 출발점을 시작으로 표시한다", () => {
    setAnniversariesState({ previousAnniversary: null });

    render(<AnniversaryJourney />);

    expect(screen.getByText("시작")).toBeInTheDocument();
    expect(screen.getByText("0일")).toBeInTheDocument();
  });

  it("지난 기념일이 있으면 출발점에 그 제목과 경과일을 표시한다", () => {
    setAnniversariesState({
      previousAnniversary: {
        id: "d-200",
        title: "200일",
        date: "2026-07-19",
        daysLeft: -15,
      } as unknown as Anniversary,
    });

    render(<AnniversaryJourney />);

    expect(screen.getByText("200일")).toBeInTheDocument();
    expect(screen.getByText("15일 전")).toBeInTheDocument();
  });

  it("다음 기념일 정보를 접근성 라벨에 반영한다", () => {
    setAnniversariesState({});

    render(<AnniversaryJourney />);

    expect(
      screen.getByRole("button", { name: "다음 기념일 300일까지 84일 남음, 기념일 페이지로 이동" })
    ).toBeInTheDocument();
  });

  it("레일을 클릭하면 기념일 페이지로 이동한다", () => {
    setAnniversariesState({});

    render(<AnniversaryJourney />);
    fireEvent.click(screen.getByRole("button"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.ANNIVERSARY.path);
  });
});

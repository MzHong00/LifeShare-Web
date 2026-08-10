import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { useAnniversaries } from "@/features/anniversary/hooks/useAnniversaries";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { AnniversaryView } from "./AnniversaryView";

import type { Anniversary } from "@/features/anniversary/types/anniversary";
import type { Workspace } from "@/features/workspace/types/workspace";

const FIXED_NOW = new Date("2026-08-04T09:00:00+09:00"); // 날짜 계산 고정 기준 시각

vi.mock("@/features/anniversary/hooks/useAnniversaries", () => ({
  useAnniversaries: vi.fn(),
}));

vi.mock("@/features/workspace/hooks/useCurrentWorkspace", () => ({
  useCurrentWorkspace: vi.fn(),
}));

vi.mock("@/components/layout/AppHeader", () => ({
  AppHeader: () => <header />,
}));

const mockUseAnniversaries = vi.mocked(useAnniversaries);
const mockUseCurrentWorkspace = vi.mocked(useCurrentWorkspace);

const anniversaries: Anniversary[] = [
  { id: "d-100", title: "100일", date: "2026-08-04", daysLeft: 0 },
  { id: "d-200", title: "200일", date: "2026-11-12", daysLeft: 100 },
];

/** useAnniversaries 반환값을 원하는 상태로 세팅한다 */
const setAnniversaryState = (state: {
  startDate?: string;
  days?: number;
  anniversaries?: Anniversary[];
}) => {
  mockUseAnniversaries.mockReturnValue({
    startDate: state.startDate,
    days: state.days ?? 0,
    anniversaries: state.anniversaries ?? [],
    previousAnniversary: null,
  } as unknown as ReturnType<typeof useAnniversaries>);
};

/** useCurrentWorkspace 반환값을 원하는 상태로 세팅한다 */
const setWorkspaceState = (currentWorkspace: Workspace | null) => {
  mockUseCurrentWorkspace.mockReturnValue({
    workspaces: currentWorkspace ? [currentWorkspace] : [],
    currentWorkspace,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useCurrentWorkspace>);
};

describe("AnniversaryView", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    setWorkspaceState(null);
    setAnniversaryState({ startDate: "2026-04-27", days: 365, anniversaries });
  });

  it("기념일 목록의 제목과 날짜를 렌더링한다", () => {
    render(<AnniversaryView />);

    expect(screen.getByText("100일")).toBeInTheDocument();
    expect(screen.getByText("2026.08.04")).toBeInTheDocument();
    expect(screen.getByText("200일")).toBeInTheDocument();
    expect(screen.getByText("2026.11.12")).toBeInTheDocument();
  });

  it("기념일의 daysLeft에 따라 D-day 상태를 표시한다", () => {
    render(<AnniversaryView />);

    expect(screen.getByText("오늘!")).toBeInTheDocument();
    expect(screen.getByText("D-100")).toBeInTheDocument();
  });

  it("기념일이 없으면 목록 항목을 렌더링하지 않는다", () => {
    setAnniversaryState({ startDate: "2026-04-27", days: 365, anniversaries: [] });

    render(<AnniversaryView />);

    expect(screen.getByText("다가오는 기념일")).toBeInTheDocument();
    expect(screen.queryByText("100일")).not.toBeInTheDocument();
    expect(screen.queryByText(/^D-/)).not.toBeInTheDocument();
  });

  it("시작일이 있으면 시작일과 함께한 일수를 표시한다", () => {
    render(<AnniversaryView />);

    expect(screen.getByText("2026.04.27 시작")).toBeInTheDocument();
    expect(screen.getByText("365")).toBeInTheDocument();
    expect(screen.getByText("함께한 날")).toBeInTheDocument();
  });

  it("시작일이 없으면 미설정 안내와 0일을 표시한다", () => {
    setAnniversaryState({ startDate: undefined, days: 0, anniversaries: [] });

    render(<AnniversaryView />);

    expect(screen.getByText("시작일 미설정")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("워크스페이스 배경 이미지가 없으면 히어로 이미지를 렌더링하지 않는다", () => {
    setWorkspaceState(null);

    render(<AnniversaryView />);

    expect(screen.queryByAltText("anniversary hero")).not.toBeInTheDocument();
  });

  it("워크스페이스 배경 이미지가 있으면 히어로 이미지를 렌더링한다", () => {
    setWorkspaceState({
      id: "workspace-1",
      name: "우리집",
      backgroundImage: "/hero.png",
    } as unknown as Workspace);

    render(<AnniversaryView />);

    expect(screen.getByAltText("anniversary hero")).toBeInTheDocument();
  });
});

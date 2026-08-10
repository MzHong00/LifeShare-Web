import { render, screen, fireEvent } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { modalActions } from "@/stores/useModalStore";
import { MemoryFeed } from "./MemoryFeed";

import type { Workspace } from "@/features/workspace/types/workspace";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/features/workspace/hooks/useCurrentWorkspace", () => ({
  useCurrentWorkspace: vi.fn(),
}));

vi.mock("@/features/auth/queries/authQueries", () => ({
  authQueries: { user: vi.fn(() => ({ queryKey: ["auth", "user"] })) },
}));

vi.mock("@/stores/useModalStore", () => ({
  modalActions: { showModal: vi.fn() },
}));

vi.mock("./AnniversarySpotlight", () => ({
  AnniversarySpotlight: () => <div>기념일스포트라이트</div>,
}));

vi.mock("./AnniversaryJourney", () => ({
  AnniversaryJourney: () => <div>기념일여정</div>,
}));

vi.mock("./UpcomingDigest", () => ({
  UpcomingDigest: () => <div>다이제스트</div>,
}));

vi.mock("./ActivityDashboard", () => ({
  ActivityDashboard: () => <div>활동대시보드</div>,
}));

const mockUseQuery = vi.mocked(useQuery);
const mockUseCurrentWorkspace = vi.mocked(useCurrentWorkspace);
const mockShowModal = vi.mocked(modalActions.showModal);

const MORNING_NOW = new Date("2026-08-03T08:00:00"); // 인사말 분기 고정용 오전 기준 시각

const workspace = {
  id: "workspace-1",
  name: "우리집",
  members: [
    { id: "user-1", name: "홍길동", email: "me@test.com" },
    { id: "user-2", name: "파트너", email: "partner@test.com" },
  ],
} as unknown as Workspace;

/** useCurrentWorkspace·사용자 쿼리 반환값을 원하는 상태로 세팅한다 */
const setFeedState = (state: { currentWorkspace?: Workspace | null; userName?: string | null }) => {
  mockUseCurrentWorkspace.mockReturnValue({
    currentWorkspace: state.currentWorkspace ?? null,
  } as unknown as ReturnType<typeof useCurrentWorkspace>);
  mockUseQuery.mockReturnValue({
    data: state.userName === null ? undefined : { id: "user-1", name: state.userName },
  } as unknown as ReturnType<typeof useQuery>);
};

describe("MemoryFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(MORNING_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("워크스페이스가 없으면 아무것도 렌더링하지 않는다", () => {
    setFeedState({ currentWorkspace: null, userName: "홍길동" });

    const { container } = render(<MemoryFeed />);

    expect(container).toBeEmptyDOMElement();
  });

  it("사용자 정보가 없으면 아무것도 렌더링하지 않는다", () => {
    setFeedState({ currentWorkspace: workspace, userName: null });

    const { container } = render(<MemoryFeed />);

    expect(container).toBeEmptyDOMElement();
  });

  it("시각대에 맞는 인사말과 사용자 이름을 렌더링한다", () => {
    setFeedState({ currentWorkspace: workspace, userName: "홍길동" });

    render(<MemoryFeed />);

    expect(screen.getByText("좋은 아침이에요, 홍길동님")).toBeInTheDocument();
  });

  it("밤 시각에는 밤 인사말을 렌더링하고 이름이 없으면 이름을 붙이지 않는다", () => {
    vi.setSystemTime(new Date("2026-08-03T23:00:00"));
    setFeedState({ currentWorkspace: workspace, userName: "" });

    render(<MemoryFeed />);

    expect(screen.getByText("포근한 밤이에요")).toBeInTheDocument();
  });

  it("오후 시각에는 오후 인사말을 렌더링한다", () => {
    vi.setSystemTime(new Date("2026-08-03T14:00:00"));
    setFeedState({ currentWorkspace: workspace, userName: "홍길동" });

    render(<MemoryFeed />);

    expect(screen.getByText("좋은 오후예요, 홍길동님")).toBeInTheDocument();
  });

  it("저녁 시각에는 저녁 인사말을 렌더링한다", () => {
    vi.setSystemTime(new Date("2026-08-03T19:00:00"));
    setFeedState({ currentWorkspace: workspace, userName: "홍길동" });

    render(<MemoryFeed />);

    expect(screen.getByText("좋은 저녁이에요, 홍길동님")).toBeInTheDocument();
  });

  it("하위 위젯들을 모두 렌더링한다", () => {
    setFeedState({ currentWorkspace: workspace, userName: "홍길동" });

    render(<MemoryFeed />);

    expect(screen.getByText("기념일스포트라이트")).toBeInTheDocument();
    expect(screen.getByText("기념일여정")).toBeInTheDocument();
    expect(screen.getByText("다이제스트")).toBeInTheDocument();
    expect(screen.getByText("활동대시보드")).toBeInTheDocument();
  });

  it("참여자 수를 아바타 스택 접근성 라벨에 반영한다", () => {
    setFeedState({ currentWorkspace: workspace, userName: "홍길동" });

    render(<MemoryFeed />);

    expect(screen.getByRole("button", { name: "참여자 2명 보기" })).toBeInTheDocument();
  });

  it("아바타 스택을 클릭하면 참여자 목록 모달을 띄운다", () => {
    setFeedState({ currentWorkspace: workspace, userName: "홍길동" });

    render(<MemoryFeed />);
    fireEvent.click(screen.getByRole("button", { name: "참여자 2명 보기" }));

    expect(mockShowModal).toHaveBeenCalledWith(
      expect.objectContaining({ type: "alert", title: "참여자 목록" })
    );
  });

  it("참여자가 없으면 모달을 띄우지 않는다", () => {
    setFeedState({
      currentWorkspace: { ...workspace, members: [] } as unknown as Workspace,
      userName: "홍길동",
    });

    render(<MemoryFeed />);
    fireEvent.click(screen.getByRole("button", { name: "참여자 0명 보기" }));

    expect(mockShowModal).not.toHaveBeenCalled();
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { useSwipeDismiss } from "@/features/stories/hooks/useSwipeDismiss";
import { StoryDetailOverlay } from "./StoryDetailOverlay";

import type { Story } from "@/features/stories/types/story";

vi.mock("@/features/stories/hooks/useSwipeDismiss", () => ({ useSwipeDismiss: vi.fn() }));

vi.mock("@/features/stories/components/StoryDetailContent", () => ({
  StoryDetailContent: ({ story }: { story: Story }) => (
    <div data-testid="detail-content">{story.title}</div>
  ),
}));

const mockUseSwipeDismiss = vi.mocked(useSwipeDismiss);

const handlePointerDown = vi.fn();
const handlePointerMove = vi.fn();
const handlePointerUp = vi.fn();

const story: Story = {
  id: "story-1",
  title: "제주 여행",
  date: "2026-03-05T00:00:00.000Z",
  path: [],
  pathColor: "#3182f6",
  userId: "user-1",
  workspaceId: "ws-1",
};

describe("StoryDetailOverlay", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSwipeDismiss.mockReturnValue({
      overlayRef: { current: null },
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
    } as unknown as ReturnType<typeof useSwipeDismiss>);
  });

  it("상세 본문을 렌더링한다", () => {
    render(<StoryDetailOverlay story={story} onClose={onClose} />);

    expect(screen.getByTestId("detail-content")).toHaveTextContent("제주 여행");
  });

  it("닫기 버튼을 클릭하면 onClose를 호출한다", () => {
    render(<StoryDetailOverlay story={story} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("상세 닫기"));

    expect(onClose).toHaveBeenCalled();
  });

  it("스와이프 닫기 훅에 onClose를 전달한다", () => {
    render(<StoryDetailOverlay story={story} onClose={onClose} />);

    expect(mockUseSwipeDismiss).toHaveBeenCalledWith(onClose);
  });

  it("포인터 이벤트를 스와이프 핸들러로 연결한다", () => {
    render(<StoryDetailOverlay story={story} onClose={onClose} />);
    const overlay = screen.getByLabelText("상세 닫기").parentElement as HTMLElement;

    fireEvent.pointerDown(overlay, { pointerId: 1, clientX: 0 });
    fireEvent.pointerMove(overlay, { pointerId: 1, clientX: 50 });
    fireEvent.pointerUp(overlay, { pointerId: 1, clientX: 200 });

    expect(handlePointerDown).toHaveBeenCalled();
    expect(handlePointerMove).toHaveBeenCalled();
    expect(handlePointerUp).toHaveBeenCalled();
  });

  it("포인터 취소도 스와이프 종료 핸들러로 처리한다", () => {
    render(<StoryDetailOverlay story={story} onClose={onClose} />);
    const overlay = screen.getByLabelText("상세 닫기").parentElement as HTMLElement;

    fireEvent.pointerCancel(overlay, { pointerId: 1 });

    expect(handlePointerUp).toHaveBeenCalled();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { StoryBoardView } from "./StoryBoardView";

import type { Story } from "@/features/stories/types/story";

// 마우스 클릭은 동작하지 않고 터치만 동작하던 버그 재현 테스트.
// 원인: 부채꼴 5장 카드(.fannedCard)의 onClick은 각 카드에 있지만, 드래그 시작 시
// 포인터 캡처는 delegate 부모(.bigStack, e.currentTarget)에 걸려 있었다.
// 캡처가 실제 클릭 대상이 아닌 부모에 걸리면, 이후 발생하는 click 이벤트가 onClick이 없는
// 부모로 리타깃되어(브라우저별 포인터 캡처 동작 차이) 마우스 클릭 시 카드의 onClick이 동작하지 않았다.
// (jsdom은 setPointerCapture로 인한 click 리타깃 자체를 구현하지 않으므로,
//  실제 캡처 대상이 "눌린 카드(e.target)"인지를 직접 검증한다.)

vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));

vi.mock("@/features/workspace/hooks/useCurrentWorkspace", () => ({
  useCurrentWorkspace: vi.fn(),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return { ...actual, useQuery: vi.fn() };
});

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill: _fill, ...rest } = props;
    return <img alt="" {...rest} />;
  },
}));

const STORIES: Story[] = [
  {
    id: "story-1",
    title: "첫번째 기억",
    date: "2026-01-01",
    path: [],
    pathColor: "#3182f6",
    userId: "user-1",
    workspaceId: "ws-1",
  },
];

const mockUseRouter = vi.mocked(useRouter);
const mockUseCurrentWorkspace = vi.mocked(useCurrentWorkspace);
const mockUseQuery = vi.mocked(useQuery);

describe("StoryBoardView 부채꼴 카드 클릭 버그", () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);

    mockUseCurrentWorkspace.mockReturnValue({
      currentWorkspace: { id: "ws-1", name: "우리", type: "couple", themeColor: "blue" },
      workspaces: [],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCurrentWorkspace>);

    mockUseQuery.mockReturnValue({
      data: STORIES,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useQuery>);
  });

  it("드래그 시작 시 부모(.bigStack)가 아닌 실제로 누른 카드에 포인터 캡처를 건다", () => {
    const setPointerCaptureSpy = vi.fn();
    HTMLElement.prototype.setPointerCapture = function (this: HTMLElement, pointerId: number) {
      setPointerCaptureSpy(this, pointerId);
    };
    HTMLElement.prototype.releasePointerCapture = vi.fn();

    render(<StoryBoardView />);

    const cardSurface = screen.getByLabelText(`기억, ${STORIES[0].title}`);
    const fannedCard = cardSurface.parentElement as HTMLElement; // onClick이 등록된 .fannedCard

    fireEvent.pointerDown(fannedCard, { clientX: 100, pointerId: 1 });

    expect(setPointerCaptureSpy).toHaveBeenCalledTimes(1);
    // 캡처 대상(this)이 delegate 부모가 아니라 실제로 누른 카드(fannedCard) 자신이어야 한다.
    expect(setPointerCaptureSpy.mock.calls[0][0]).toBe(fannedCard);
  });
});

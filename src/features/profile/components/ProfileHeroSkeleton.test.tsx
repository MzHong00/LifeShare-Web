import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProfileHeroSkeleton } from "./ProfileHeroSkeleton";

vi.mock("@/components/feedback/Skeleton", () => ({
  Skeleton: ({ width, height }: { width?: number | string; height?: number | string }) => (
    <div data-testid="skeleton" data-width={String(width)} data-height={String(height)} />
  ),
}));

describe("ProfileHeroSkeleton", () => {
  it("아바타·이름·이메일 3개의 스켈레톤 라인을 렌더링한다", () => {
    const { getAllByTestId } = render(<ProfileHeroSkeleton />);

    const skeletons = getAllByTestId("skeleton");

    expect(skeletons).toHaveLength(3);
    expect(skeletons[0]).toHaveAttribute("data-width", "88");
    expect(skeletons[1]).toHaveAttribute("data-width", "120");
    expect(skeletons[2]).toHaveAttribute("data-width", "160");
  });

  it("장식용 영역이므로 스크린리더에서 숨긴다", () => {
    const { container } = render(<ProfileHeroSkeleton />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Skeleton } from "./Skeleton";

describe("Skeleton", () => {
  it("기본 props로 렌더링하면 width 100%, radius 8px가 적용된다", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;

    expect(el.style.getPropertyValue("--skeleton-width")).toBe("100%");
    expect(el.style.getPropertyValue("--skeleton-radius")).toBe("8px");
  });

  it("aria-hidden 속성이 적용된다", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;

    expect(el).toHaveAttribute("aria-hidden", "true");
  });

  it("width, height, radius를 지정하면 해당 스타일이 적용된다", () => {
    const { container } = render(<Skeleton width={120} height={40} radius={4} />);
    const el = container.firstChild as HTMLElement;

    expect(el.style.getPropertyValue("--skeleton-width")).toBe("120px");
    expect(el.style.getPropertyValue("--skeleton-height")).toBe("40px");
    expect(el.style.getPropertyValue("--skeleton-radius")).toBe("4px");
  });

  it("className을 전달하면 병합된다", () => {
    const { container } = render(<Skeleton className="custom" />);

    expect(container.firstChild).toHaveClass("custom");
  });
});

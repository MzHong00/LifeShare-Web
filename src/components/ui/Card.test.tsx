import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Card } from "./Card";

describe("Card", () => {
  it("children을 렌더링한다", () => {
    render(<Card>카드 내용</Card>);

    expect(screen.getByText("카드 내용")).toBeInTheDocument();
  });

  it("onClick이 없으면 clickable 클래스가 적용되지 않는다", () => {
    const { container } = render(<Card>내용</Card>);

    expect((container.firstChild as HTMLElement).className).not.toMatch(/clickable/);
  });

  it("onClick이 있으면 clickable 클래스가 적용되고 클릭 시 호출된다", () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>내용</Card>);

    const card = screen.getByText("내용");
    expect(card.className).toMatch(/clickable/);

    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("className을 전달하면 병합된다", () => {
    const { container } = render(<Card className="custom">내용</Card>);

    expect(container.firstChild).toHaveClass("custom");
  });
});

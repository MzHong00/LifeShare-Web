import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Spinner } from "./Spinner";

const DEFAULT_SIZE = "28"; // Spinner size prop 기본값
const CUSTOM_SIZE = 48; // 테스트용 커스텀 아이콘 크기

describe("Spinner", () => {
  it("로딩 상태를 알리는 role과 aria-label을 렌더링한다", () => {
    render(<Spinner />);

    expect(screen.getByRole("status", { name: "로딩 중" })).toBeInTheDocument();
  });

  it("size를 전달하지 않으면 기본 크기로 하트 아이콘을 렌더링한다", () => {
    const { container } = render(<Spinner />);

    const hearts = container.querySelectorAll("svg");
    expect(hearts).toHaveLength(2);
    hearts.forEach((heart) => {
      expect(heart).toHaveAttribute("width", DEFAULT_SIZE);
      expect(heart).toHaveAttribute("height", DEFAULT_SIZE);
    });
  });

  it("size를 전달하면 하트 아이콘 크기에 반영된다", () => {
    const { container } = render(<Spinner size={CUSTOM_SIZE} />);

    container.querySelectorAll("svg").forEach((heart) => {
      expect(heart).toHaveAttribute("width", String(CUSTOM_SIZE));
    });
  });

  it("className을 전달하면 병합된다", () => {
    render(<Spinner className="custom" />);

    const spinner = screen.getByRole("status");
    expect(spinner).toHaveClass("custom");
    expect(spinner.className).toMatch(/spinner/);
  });

  it("장식용 요소는 aria-hidden으로 접근성 트리에서 제외한다", () => {
    const { container } = render(<Spinner />);

    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3);
  });
});

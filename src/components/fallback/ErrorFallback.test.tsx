import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ErrorFallback } from "./ErrorFallback";

const DEFAULT_DESC = "일시적인 오류가 발생했습니다.\n잠시 후 다시 시도해주세요."; // desc 미전달 시 기본 문구

describe("ErrorFallback", () => {
  it("제목과 재시도 버튼을 렌더링한다", () => {
    render(<ErrorFallback onRetry={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "문제가 발생했습니다" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
  });

  it("desc를 전달하지 않으면 기본 안내 문구를 렌더링한다", () => {
    const { container } = render(<ErrorFallback onRetry={vi.fn()} />);

    expect(container.querySelector("p")?.textContent).toBe(DEFAULT_DESC);
  });

  it("desc를 전달하면 해당 메시지를 렌더링한다", () => {
    render(<ErrorFallback desc="네트워크 연결을 확인해주세요" onRetry={vi.fn()} />);

    expect(screen.getByText("네트워크 연결을 확인해주세요")).toBeInTheDocument();
  });

  it("빈 문자열 desc는 기본 안내 문구로 대체된다", () => {
    const { container } = render(<ErrorFallback desc="" onRetry={vi.fn()} />);

    expect(container.querySelector("p")?.textContent).toBe(DEFAULT_DESC);
  });

  it("다시 시도 버튼 클릭 시 onRetry가 호출된다", () => {
    const onRetry = vi.fn();
    render(<ErrorFallback onRetry={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

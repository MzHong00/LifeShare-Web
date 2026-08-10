import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { SetupInitialStep } from "./SetupInitialStep";

describe("SetupInitialStep", () => {
  const onStart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("라이프룸 만들기 안내 문구를 렌더링한다", () => {
    render(<SetupInitialStep onStart={onStart} />);

    expect(screen.getByRole("heading", { name: "라이프룸 만들기" })).toBeInTheDocument();
    expect(screen.getByText(/파트너를 초대하여/)).toBeInTheDocument();
  });

  it("생성 시작 버튼 클릭 시 onStart를 호출한다", () => {
    render(<SetupInitialStep onStart={onStart} />);
    fireEvent.click(screen.getByRole("button", { name: /새로운 라이프룸 만들기/ }));

    expect(onStart).toHaveBeenCalledTimes(1);
  });
});

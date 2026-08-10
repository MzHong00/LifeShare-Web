import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { globalLoadingActions } from "@/stores/useGlobalLoadingStore";

import { GlobalLoadingOverlay } from "./GlobalLoadingOverlay";

describe("GlobalLoadingOverlay", () => {
  afterEach(() => {
    globalLoadingActions.hide();
  });

  it("로딩 상태가 아니면 아무것도 렌더링하지 않는다", () => {
    const { container } = render(<GlobalLoadingOverlay />);

    expect(container).toBeEmptyDOMElement();
  });

  it("show 호출 시 오버레이와 스피너를 렌더링한다", () => {
    globalLoadingActions.show();
    render(<GlobalLoadingOverlay />);

    expect(screen.getByRole("alert")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status", { name: "로딩 중" })).toBeInTheDocument();
  });

  it("메시지 없이 show하면 메시지 문단을 렌더링하지 않는다", () => {
    globalLoadingActions.show();
    const { container } = render(<GlobalLoadingOverlay />);

    expect(container.querySelector("p")).toBeNull();
  });

  it("메시지와 함께 show하면 메시지를 렌더링한다", () => {
    globalLoadingActions.show("저장 중입니다");
    render(<GlobalLoadingOverlay />);

    expect(screen.getByText("저장 중입니다")).toBeInTheDocument();
  });

  it("hide 호출 시 오버레이가 사라진다", () => {
    globalLoadingActions.show("불러오는 중");
    const { container } = render(<GlobalLoadingOverlay />);

    act(() => globalLoadingActions.hide());

    expect(container).toBeEmptyDOMElement();
  });
});

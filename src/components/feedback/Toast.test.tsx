import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { toastActions } from "@/stores/useToastStore";

import { Toast } from "./Toast";

describe("Toast", () => {
  it("토스트가 없으면 아무것도 렌더링하지 않는다", () => {
    const { container } = render(<Toast />);

    expect(container).toBeEmptyDOMElement();
  });

  it("showToast 호출 시 메시지를 렌더링한다", () => {
    toastActions.showToast("저장되었습니다", "success");
    render(<Toast />);

    expect(screen.getByText("저장되었습니다")).toBeInTheDocument();
  });

  it("type에 따라 data-type 속성이 설정된다", () => {
    toastActions.showToast("오류가 발생했습니다", "error");
    const { container } = render(<Toast />);

    expect(container.querySelector('[data-type="error"]')).toBeInTheDocument();
  });

  it("새 토스트가 뜨면 이전 토스트를 대체하고 하나만 렌더링한다", () => {
    toastActions.showToast("정보 메시지", "info");
    toastActions.showToast("경고 메시지", "warning");
    render(<Toast />);

    expect(screen.queryByText("정보 메시지")).not.toBeInTheDocument();
    expect(screen.getByText("경고 메시지")).toBeInTheDocument();
  });
});

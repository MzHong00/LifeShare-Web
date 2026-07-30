import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { modalActions } from "@/stores/useModalStore";

import { Modal } from "./Modal";

describe("Modal", () => {
  it("모달이 없으면 아무것도 렌더링하지 않는다", () => {
    const { container } = render(<Modal />);

    expect(container).toBeEmptyDOMElement();
  });

  it("alert 타입이면 확인 버튼만 렌더링한다", () => {
    modalActions.showModal({ type: "alert", title: "알림", message: "완료되었습니다" });
    render(<Modal />);

    expect(screen.getByText("알림")).toBeInTheDocument();
    expect(screen.getByText("완료되었습니다")).toBeInTheDocument();
    expect(screen.getByText("확인")).toBeInTheDocument();
    expect(screen.queryByText("취소")).not.toBeInTheDocument();
  });

  it("confirm 타입이면 확인/취소 버튼을 모두 렌더링한다", () => {
    modalActions.showModal({ type: "confirm", title: "삭제 확인" });
    render(<Modal />);

    expect(screen.getByText("확인")).toBeInTheDocument();
    expect(screen.getByText("취소")).toBeInTheDocument();
  });

  it("content가 있으면 커스텀 콘텐츠를 렌더링한다", () => {
    modalActions.showModal({
      type: "alert",
      title: "커스텀",
      content: <div>커스텀 콘텐츠</div>,
    });
    render(<Modal />);

    expect(screen.getByText("커스텀 콘텐츠")).toBeInTheDocument();
  });

  it("확인 버튼 클릭 시 onConfirm이 호출되고 모달이 닫힌다", () => {
    const onConfirm = vi.fn();
    modalActions.showModal({ type: "alert", title: "알림", onConfirm });
    render(<Modal />);

    fireEvent.click(screen.getByText("확인"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("알림")).not.toBeInTheDocument();
  });

  it("취소 버튼 클릭 시 onCancel이 호출되고 모달이 닫힌다", () => {
    const onCancel = vi.fn();
    modalActions.showModal({ type: "confirm", title: "삭제 확인", onCancel });
    render(<Modal />);

    fireEvent.click(screen.getByText("취소"));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("삭제 확인")).not.toBeInTheDocument();
  });

  it("confirmPhrase가 있으면 입력 전에는 확인 버튼이 비활성화된다", () => {
    modalActions.showModal({ type: "confirm", title: "삭제 확인", confirmPhrase: "삭제하기" });
    render(<Modal />);

    expect(screen.getByText("확인")).toBeDisabled();
  });

  it("confirmPhrase와 다른 값을 입력하면 확인 버튼이 계속 비활성화된다", () => {
    const onConfirm = vi.fn();
    modalActions.showModal({
      type: "confirm",
      title: "삭제 확인",
      confirmPhrase: "삭제하기",
      onConfirm,
    });
    render(<Modal />);

    fireEvent.change(screen.getByPlaceholderText("삭제하기"), { target: { value: "삭제" } });

    expect(screen.getByText("확인")).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("confirmPhrase와 일치하게 입력하면 확인 버튼이 열리고 onConfirm이 호출된다", () => {
    const onConfirm = vi.fn();
    modalActions.showModal({
      type: "confirm",
      title: "삭제 확인",
      confirmPhrase: "삭제하기",
      onConfirm,
    });
    render(<Modal />);

    fireEvent.change(screen.getByPlaceholderText("삭제하기"), { target: { value: "삭제하기" } });
    fireEvent.click(screen.getByText("확인"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("confirmText, cancelText가 있으면 커스텀 라벨을 렌더링한다", () => {
    modalActions.showModal({
      type: "confirm",
      title: "삭제 확인",
      confirmText: "삭제",
      cancelText: "닫기",
    });
    render(<Modal />);

    expect(screen.getByText("삭제")).toBeInTheDocument();
    expect(screen.getByText("닫기")).toBeInTheDocument();
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { toastActions } from "@/stores/useToastStore";

import { ChatInput } from "./ChatInput";

describe("ChatInput", () => {
  const onChange = vi.fn();
  const onSend = vi.fn();

  /** 주어진 입력값으로 렌더링한다 */
  const renderInput = (value = "") =>
    render(<ChatInput value={value} onChange={onChange} onSend={onSend} />);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("전달받은 입력값을 입력창에 표시한다", () => {
    renderInput("안녕");

    expect(screen.getByPlaceholderText("메시지...")).toHaveValue("안녕");
  });

  it("입력창에 타이핑하면 onChange를 호출한다", () => {
    renderInput();
    fireEvent.change(screen.getByPlaceholderText("메시지..."), { target: { value: "하이" } });

    expect(onChange).toHaveBeenCalledWith("하이");
  });

  it("입력값이 있으면 전송 버튼이 활성화된다", () => {
    renderInput("안녕");

    expect(screen.getByRole("button", { name: "메시지 전송" })).toBeEnabled();
  });

  it("입력값이 비어 있으면 전송 버튼을 비활성화해 전송을 차단한다", () => {
    renderInput("");

    expect(screen.getByRole("button", { name: "메시지 전송" })).toBeDisabled();
  });

  it("공백만 입력된 경우에도 전송 버튼을 비활성화한다", () => {
    renderInput("   ");

    expect(screen.getByRole("button", { name: "메시지 전송" })).toBeDisabled();
  });

  it("전송 버튼을 클릭하면 onSend를 호출한다", () => {
    renderInput("안녕");
    fireEvent.click(screen.getByRole("button", { name: "메시지 전송" }));

    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it("Enter 입력 시 메시지를 전송한다", () => {
    renderInput("안녕");
    fireEvent.keyDown(screen.getByPlaceholderText("메시지..."), { key: "Enter" });

    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it("Shift+Enter 입력 시에는 전송하지 않는다", () => {
    renderInput("안녕");
    fireEvent.keyDown(screen.getByPlaceholderText("메시지..."), { key: "Enter", shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it("IME 조합 중 Enter 입력은 무시한다", () => {
    renderInput("안녕");
    const input = screen.getByPlaceholderText("메시지...");
    const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
    Object.defineProperty(event, "isComposing", { value: true });
    fireEvent(input, event);

    expect(onSend).not.toHaveBeenCalled();
  });

  it("Enter 외의 키 입력은 전송하지 않는다", () => {
    renderInput("안녕");
    fireEvent.keyDown(screen.getByPlaceholderText("메시지..."), { key: "a" });

    expect(onSend).not.toHaveBeenCalled();
  });

  it("도구함 버튼을 누르면 액션 목록이 열리고 다시 누르면 닫힌다", () => {
    renderInput();
    fireEvent.click(screen.getByRole("button", { name: "도구함 열기" }));

    expect(screen.getByText("갤러리")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "도구함 닫기" }));

    expect(screen.queryByText("갤러리")).not.toBeInTheDocument();
  });

  it("도구함 액션을 선택하면 준비 중 토스트를 띄우고 도구함을 닫는다", () => {
    const showToast = vi.spyOn(toastActions, "showToast").mockImplementation(() => {});
    renderInput();
    fireEvent.click(screen.getByRole("button", { name: "도구함 열기" }));
    fireEvent.click(screen.getByText("카메라"));

    expect(showToast).toHaveBeenCalledWith("카메라 기능은 준비 중입니다", "info");
    expect(screen.queryByText("카메라")).not.toBeInTheDocument();

    showToast.mockRestore();
  });

  it("전송 버튼을 클릭하면 열려 있던 도구함을 닫는다", () => {
    renderInput("안녕");
    fireEvent.click(screen.getByRole("button", { name: "도구함 열기" }));
    fireEvent.click(screen.getByRole("button", { name: "메시지 전송" }));

    expect(screen.queryByText("갤러리")).not.toBeInTheDocument();
  });
});

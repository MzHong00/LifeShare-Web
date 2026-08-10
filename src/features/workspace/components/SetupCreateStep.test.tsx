import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { SetupCreateStep } from "./SetupCreateStep";

import type { RoomType } from "@/features/workspace/types/workspace";

describe("SetupCreateStep", () => {
  const onSelectType = vi.fn();
  const onChangeName = vi.fn();
  const onChangeStartDate = vi.fn();
  const onToggleMain = vi.fn();

  /** 지정한 세부 단계/상태로 렌더링한다 */
  const renderStep = (
    overrides: {
      subStep?: "type" | "name";
      roomType?: RoomType;
      workspaceName?: string;
      startDate?: string;
      isMain?: boolean;
    } = {}
  ) =>
    render(
      <SetupCreateStep
        subStep={overrides.subStep ?? "type"}
        roomType={overrides.roomType ?? "couple"}
        workspaceName={overrides.workspaceName ?? ""}
        startDate={overrides.startDate ?? "2026-01-01"}
        isMain={overrides.isMain ?? true}
        onSelectType={onSelectType}
        onChangeName={onChangeName}
        onChangeStartDate={onChangeStartDate}
        onToggleMain={onToggleMain}
      />
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("유형 선택 단계에서는 유형 옵션을 렌더링한다", () => {
    renderStep({ subStep: "type" });

    expect(screen.getByRole("heading", { name: "유형 선택" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "커플 라이프룸" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "단체 라이프룸" })).toBeInTheDocument();
  });

  it("커플 유형을 선택하면 couple로 onSelectType을 호출한다", () => {
    renderStep({ subStep: "type" });
    fireEvent.click(screen.getByRole("button", { name: "커플 라이프룸" }));

    expect(onSelectType).toHaveBeenCalledWith("couple");
  });

  it("단체 유형을 선택하면 group으로 onSelectType을 호출한다", () => {
    renderStep({ subStep: "type" });
    fireEvent.click(screen.getByRole("button", { name: "단체 라이프룸" }));

    expect(onSelectType).toHaveBeenCalledWith("group");
  });

  it("이름 입력 단계에서는 이름 설정 폼을 렌더링한다", () => {
    renderStep({ subStep: "name", workspaceName: "우리집" });

    expect(screen.getByRole("heading", { name: "이름 설정" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("라이프룸 이름을 입력하세요")).toHaveValue("우리집");
  });

  it("커플 유형이면 시작일 라벨을 만난 날짜로 표시한다", () => {
    renderStep({ subStep: "name", roomType: "couple" });

    expect(screen.getByText("만난 날짜")).toBeInTheDocument();
  });

  it("단체 유형이면 시작일 라벨을 시작일로 표시한다", () => {
    renderStep({ subStep: "name", roomType: "group" });

    expect(screen.getByText("시작일")).toBeInTheDocument();
  });

  it("이름 입력값이 변경되면 onChangeName을 호출한다", () => {
    renderStep({ subStep: "name" });
    fireEvent.change(screen.getByPlaceholderText("라이프룸 이름을 입력하세요"), {
      target: { value: "우리집" },
    });

    expect(onChangeName).toHaveBeenCalledWith("우리집");
  });

  it("시작일을 선택하면 onChangeStartDate를 호출한다", () => {
    const { container } = renderStep({ subStep: "name", startDate: "2026-01-01" });
    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-02-02" } });

    expect(onChangeStartDate).toHaveBeenCalledWith("2026-02-02");
  });

  it("메인 설정 체크박스를 누르면 onToggleMain을 호출한다", () => {
    renderStep({ subStep: "name", isMain: false });
    fireEvent.click(screen.getByRole("button", { name: "메인 라이프룸으로 설정" }));

    expect(onToggleMain).toHaveBeenCalledTimes(1);
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { useWorkspaceSetupWizard } from "@/features/workspace/hooks/useWorkspaceSetupWizard";
import { WorkspaceSetupView } from "./WorkspaceSetupView";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn() })),
}));

vi.mock("@/features/workspace/hooks/useWorkspaceSetupWizard", () => ({
  useWorkspaceSetupWizard: vi.fn(),
}));

const mockUseWizard = vi.mocked(useWorkspaceSetupWizard);

type Wizard = ReturnType<typeof useWorkspaceSetupWizard>;

const handlers = {
  setRoomType: vi.fn(),
  setWorkspaceName: vi.fn(),
  setStartDate: vi.fn(),
  setIsMain: vi.fn(),
  startCreate: vi.fn(),
  goToNameStep: vi.fn(),
  completeCreate: vi.fn(),
  copyInviteCode: vi.fn(),
  copyInviteLink: vi.fn(),
  goBack: vi.fn(),
  skipInvite: vi.fn(),
};

/** 위저드 훅 반환값을 원하는 상태로 세팅한다 */
const setWizardState = (state: {
  step?: "initial" | "create" | "invite";
  createSubStep?: "type" | "name";
  isSaving?: boolean;
  workspaceName?: string;
}) => {
  mockUseWizard.mockReturnValue({
    step: state.step ?? "initial",
    createSubStep: state.createSubStep ?? "type",
    roomType: "couple",
    workspaceName: state.workspaceName ?? "",
    startDate: "2026-01-01",
    isMain: true,
    inviteCode: "K7M2-P9QX",
    isSaving: state.isSaving ?? false,
    ...handlers,
  } as unknown as Wizard);
};

describe("WorkspaceSetupView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initial 단계에서는 생성 시작 화면을 렌더링한다", () => {
    setWizardState({ step: "initial" });

    render(<WorkspaceSetupView />);

    expect(screen.getByRole("button", { name: /새로운 라이프룸 만들기/ })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "유형 선택" })).not.toBeInTheDocument();
  });

  it("create 단계에서는 생성 입력 화면을 렌더링한다", () => {
    setWizardState({ step: "create", createSubStep: "type" });

    render(<WorkspaceSetupView />);

    expect(screen.getByRole("heading", { name: "유형 선택" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "이전으로" })).toBeInTheDocument();
  });

  it("invite 단계에서는 초대 화면과 완료 버튼을 렌더링한다", () => {
    setWizardState({ step: "invite", workspaceName: "우리집" });

    render(<WorkspaceSetupView />);

    expect(screen.getByText("K7M2-P9QX")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "완료하기" })).toBeInTheDocument();
  });

  it("create 단계의 type 세부 단계에서는 버튼 라벨이 다음이다", () => {
    setWizardState({ step: "create", createSubStep: "type" });

    render(<WorkspaceSetupView />);

    expect(screen.getByRole("button", { name: "다음" })).toBeInTheDocument();
  });

  it("create 단계의 name 세부 단계에서는 버튼 라벨이 시작하기이다", () => {
    setWizardState({ step: "create", createSubStep: "name" });

    render(<WorkspaceSetupView />);

    expect(screen.getByRole("button", { name: "시작하기" })).toBeInTheDocument();
  });

  it("저장 중이면 버튼 라벨이 생성 중...이고 비활성화된다", () => {
    setWizardState({ step: "create", createSubStep: "name", isSaving: true });

    render(<WorkspaceSetupView />);

    expect(screen.getByRole("button", { name: "생성 중..." })).toBeDisabled();
  });

  it("type 세부 단계에서 다음 버튼을 누르면 goToNameStep을 호출한다", () => {
    setWizardState({ step: "create", createSubStep: "type" });

    render(<WorkspaceSetupView />);
    fireEvent.click(screen.getByRole("button", { name: "다음" }));

    expect(handlers.goToNameStep).toHaveBeenCalledTimes(1);
    expect(handlers.completeCreate).not.toHaveBeenCalled();
  });

  it("name 세부 단계에서 시작하기 버튼을 누르면 completeCreate를 호출한다", () => {
    setWizardState({ step: "create", createSubStep: "name" });

    render(<WorkspaceSetupView />);
    fireEvent.click(screen.getByRole("button", { name: "시작하기" }));

    expect(handlers.completeCreate).toHaveBeenCalledTimes(1);
  });

  it("initial 단계에서 시작 버튼을 누르면 startCreate를 호출한다", () => {
    setWizardState({ step: "initial" });

    render(<WorkspaceSetupView />);
    fireEvent.click(screen.getByRole("button", { name: /새로운 라이프룸 만들기/ }));

    expect(handlers.startCreate).toHaveBeenCalledTimes(1);
  });

  it("헤더 뒤로가기 버튼을 누르면 goBack을 호출한다", () => {
    setWizardState({ step: "create" });

    render(<WorkspaceSetupView />);
    fireEvent.click(screen.getByRole("button", { name: "뒤로 가기" }));

    expect(handlers.goBack).toHaveBeenCalledTimes(1);
  });

  it("완료하기 버튼을 누르면 skipInvite를 호출한다", () => {
    setWizardState({ step: "invite" });

    render(<WorkspaceSetupView />);
    fireEvent.click(screen.getByRole("button", { name: "완료하기" }));

    expect(handlers.skipInvite).toHaveBeenCalledTimes(1);
  });

  it("메인 설정 토글은 현재 isMain의 반대값으로 setIsMain을 호출한다", () => {
    setWizardState({ step: "create", createSubStep: "name" });

    render(<WorkspaceSetupView />);
    fireEvent.click(screen.getByRole("button", { name: "메인 라이프룸으로 설정" }));

    expect(handlers.setIsMain).toHaveBeenCalledWith(false);
  });
});

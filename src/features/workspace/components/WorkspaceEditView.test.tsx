import { render, screen, fireEvent } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { useWorkspaceEditActions } from "@/features/workspace/hooks/useWorkspaceEditActions";
import { workspaceActions } from "@/features/workspace/stores/useWorkspaceStore";
import { modalActions } from "@/stores/useModalStore";
import { toastActions } from "@/stores/useToastStore";
import { WorkspaceEditView } from "./WorkspaceEditView";

import type { ModalConfig } from "@/types/modal";
import type { Workspace } from "@/features/workspace/types/workspace";

const mockUser = { id: "user-1", name: "홍길동", profileImage: undefined }; // authQueries.user()가 내려주는 로그인 사용자

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: mockUser }),
}));

vi.mock("@/features/auth/queries/authQueries", () => ({
  authQueries: { user: vi.fn() },
}));

vi.mock("@/features/workspace/hooks/useCurrentWorkspace", () => ({
  useCurrentWorkspace: vi.fn(),
}));

vi.mock("@/features/workspace/hooks/useWorkspaceEditActions", () => ({
  useWorkspaceEditActions: vi.fn(),
}));

vi.mock("@/stores/useModalStore", () => ({
  modalActions: { showModal: vi.fn() },
}));

vi.mock("@/stores/useToastStore", () => ({
  toastActions: { showToast: vi.fn() },
}));

vi.mock("@/features/workspace/stores/useWorkspaceStore", () => ({
  workspaceActions: { setCurrentWorkspaceId: vi.fn() },
}));

vi.mock("@/components/layout/AppHeader", () => ({
  AppHeader: () => <header />,
}));

vi.mock("@/features/workspace/components/WorkspaceInviteShare", () => ({
  WorkspaceInviteShare: () => <div data-testid="invite-share" />,
}));

const mockUseSearchParams = vi.mocked(useSearchParams);
const mockUseCurrentWorkspace = vi.mocked(useCurrentWorkspace);
const mockUseWorkspaceEditActions = vi.mocked(useWorkspaceEditActions);
const mockShowModal = vi.mocked(modalActions.showModal);

const editActions = {
  changeName: vi.fn(),
  changeStartDate: vi.fn(),
  changeThemeColor: vi.fn(),
  changeProfileName: vi.fn(),
  kickMember: vi.fn(),
  leave: vi.fn(),
};

const workspace = {
  id: "workspace-1",
  name: "우리집",
  type: "couple",
  startDate: "2026-01-01",
  themeColor: "pink",
  members: [
    { id: "user-1", name: "홍길동", email: "me@test.com", role: "owner" },
    { id: "user-2", name: "파트너", email: "partner@test.com", role: "member" },
  ],
} as unknown as Workspace;

/** useSearchParams·useCurrentWorkspace를 원하는 상태로 세팅한다 */
const setup = (options?: {
  workspaceId?: string;
  workspaces?: Workspace[];
  currentWorkspace?: Workspace | null;
}) => {
  const workspaceId = options?.workspaceId ?? "workspace-1";
  mockUseSearchParams.mockReturnValue(
    new URLSearchParams({ workspaceId }) as unknown as ReturnType<typeof useSearchParams>
  );
  mockUseCurrentWorkspace.mockReturnValue({
    workspaces: options?.workspaces ?? [workspace],
    currentWorkspace: options?.currentWorkspace ?? null,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useCurrentWorkspace>);
};

/** showModal에 전달된 마지막 모달 설정을 꺼낸다 */
const lastModalConfig = () =>
  mockShowModal.mock.calls[mockShowModal.mock.calls.length - 1][0] as ModalConfig;

describe("WorkspaceEditView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWorkspaceEditActions.mockReturnValue(
      editActions as unknown as ReturnType<typeof useWorkspaceEditActions>
    );
  });

  it("workspaceId에 해당하는 라이프룸이 없으면 아무것도 렌더링하지 않는다", () => {
    setup({ workspaceId: "unknown" });

    const { container } = render(<WorkspaceEditView />);

    expect(container).toBeEmptyDOMElement();
  });

  it("커플 라이프룸이면 커플 배지를 렌더링한다", () => {
    setup();

    render(<WorkspaceEditView />);

    expect(screen.getByText("커플 라이프룸")).toBeInTheDocument();
  });

  it("단체 라이프룸이면 단체 배지를 렌더링한다", () => {
    setup({ workspaces: [{ ...workspace, type: "group" }] });

    render(<WorkspaceEditView />);

    expect(screen.getByText("단체 라이프룸")).toBeInTheDocument();
  });

  it("참여자 목록에 이름과 나·방장 배지를 렌더링한다", () => {
    setup();

    render(<WorkspaceEditView />);

    expect(screen.getByText("파트너")).toBeInTheDocument();
    expect(screen.getByText("나")).toBeInTheDocument();
    expect(screen.getByText("방장")).toBeInTheDocument();
  });

  it("방장이면 초대하기 메뉴를 노출한다", () => {
    setup();

    render(<WorkspaceEditView />);

    expect(screen.getByText("파트너 초대하기")).toBeInTheDocument();
    expect(screen.getByText("2명 참여 중")).toBeInTheDocument();
  });

  it("일반 멤버면 초대하기 메뉴를 노출하지 않는다", () => {
    setup({
      workspaces: [
        {
          ...workspace,
          members: [
            { id: "user-1", name: "홍길동", email: "me@test.com", role: "member" },
            { id: "user-2", name: "파트너", email: "partner@test.com", role: "owner" },
          ],
        } as unknown as Workspace,
      ],
    });

    render(<WorkspaceEditView />);

    expect(screen.queryByText("파트너 초대하기")).not.toBeInTheDocument();
  });

  it("방장이면 자신을 제외한 멤버에게 내보내기 버튼을 노출한다", () => {
    setup();

    render(<WorkspaceEditView />);

    expect(screen.getByLabelText("파트너 내보내기")).toBeInTheDocument();
    expect(screen.queryByLabelText("홍길동 내보내기")).not.toBeInTheDocument();
  });

  it("일반 멤버에게는 내보내기 버튼을 노출하지 않는다", () => {
    setup({
      workspaces: [
        {
          ...workspace,
          members: [
            { id: "user-1", name: "홍길동", email: "me@test.com", role: "member" },
            { id: "user-2", name: "파트너", email: "partner@test.com", role: "owner" },
          ],
        } as unknown as Workspace,
      ],
    });

    render(<WorkspaceEditView />);

    expect(screen.queryByLabelText("파트너 내보내기")).not.toBeInTheDocument();
  });

  it("내보내기 확인 시 해당 userId로 kickMember를 호출한다", () => {
    setup();

    render(<WorkspaceEditView />);
    fireEvent.click(screen.getByLabelText("파트너 내보내기"));

    const config = lastModalConfig();
    expect(config.title).toBe("멤버 내보내기");
    expect(config.message).toContain("파트너");
    config.onConfirm?.();
    expect(editActions.kickMember).toHaveBeenCalledWith("user-2");
  });

  it("초대하기를 클릭하면 공유 패널 모달을 띄운다", () => {
    setup();

    render(<WorkspaceEditView />);
    fireEvent.click(screen.getByText("파트너 초대하기"));

    const config = lastModalConfig();
    expect(config.type).toBe("alert");
    expect(config.title).toBe("파트너 초대하기");
    expect(config.content).toBeTruthy();
  });

  it("제목 수정 모달에서 확인하면 changeName을 호출한다", () => {
    setup();

    render(<WorkspaceEditView />);
    fireEvent.click(screen.getByText("라이프룸 제목"));

    const config = lastModalConfig();
    expect(config.title).toBe("라이프룸 제목");
    config.onConfirm?.();
    expect(editActions.changeName).toHaveBeenCalledWith("우리집");
  });

  it("마지막 멤버면 나가기 모달에서 확인 문구를 요구한다", () => {
    setup({
      workspaces: [
        {
          ...workspace,
          members: [{ id: "user-1", name: "홍길동", email: "me@test.com", role: "owner" }],
        } as unknown as Workspace,
      ],
    });

    render(<WorkspaceEditView />);
    expect(screen.getByText("마지막 멤버라 나가면 모든 기록이 삭제됩니다.")).toBeInTheDocument();

    fireEvent.click(screen.getByText("라이프룸에서 나가기"));

    const config = lastModalConfig();
    expect(config.confirmPhrase).toBe("삭제하기");
    expect(config.message).toContain("모두 삭제되며");
    config.onConfirm?.();
    expect(editActions.leave).toHaveBeenCalled();
  });

  it("마지막 멤버가 아니면 확인 문구 없이 나가기를 진행한다", () => {
    setup();

    render(<WorkspaceEditView />);
    expect(screen.getByText("데이터는 유지되지만 리스트에서 사라집니다.")).toBeInTheDocument();

    fireEvent.click(screen.getByText("라이프룸에서 나가기"));

    const config = lastModalConfig();
    expect(config.confirmPhrase).toBeUndefined();
    expect(config.message).toContain("삭제되지 않지만");
  });

  it("메인으로 설정하면 스토어를 갱신하고 성공 토스트를 띄운다", () => {
    setup();

    render(<WorkspaceEditView />);
    fireEvent.click(screen.getByText("메인으로 설정"));

    expect(workspaceActions.setCurrentWorkspaceId).toHaveBeenCalledWith("workspace-1");
    expect(toastActions.showToast).toHaveBeenCalledWith(
      "'우리집'이 메인 라이프룸으로 설정되었습니다",
      "success"
    );
  });

  it("이미 메인 라이프룸이면 설정 버튼을 비활성화한다", () => {
    setup({ currentWorkspace: workspace });

    render(<WorkspaceEditView />);

    expect(screen.getByText("이미 메인 라이프룸이에요")).toBeDisabled();
  });
});

import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ROUTES } from "@/constants/routes";
import { modalActions } from "@/stores/useModalStore";
import { toastActions } from "@/stores/useToastStore";
import { workspaceActions } from "@/features/workspace/stores/useWorkspaceStore";
import {
  useCreateWorkspaceMutation,
  useCreateInviteCodeMutation,
} from "@/features/workspace/queries/workspaceMutations";
import { useWorkspaceSetupWizard } from "./useWorkspaceSetupWizard";

const mockBack = vi.fn();
const mockReplace = vi.fn();
const mockUser = { id: "user-1" };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: mockUserRef.current }),
}));

vi.mock("@/features/auth/queries/authQueries", () => ({
  authQueries: { user: vi.fn() },
}));

vi.mock("@/features/workspace/utils/workspaceUtils", () => ({
  buildInviteLink: (code: string) => `https://duous.app/invite/${code}`,
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

vi.mock("@/features/workspace/queries/workspaceMutations", () => ({
  useCreateWorkspaceMutation: vi.fn(),
  useCreateInviteCodeMutation: vi.fn(),
}));

const mockUserRef = { current: mockUser as { id: string } | undefined };

const createMutation = (mutateAsync = vi.fn()) => ({ mutateAsync, isPending: false });

Object.defineProperty(navigator, "clipboard", {
  value: { writeText: vi.fn() },
  configurable: true,
});

describe("useWorkspaceSetupWizard", () => {
  const createWorkspaceMutateAsync = vi.fn();
  const createInviteCodeMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRef.current = mockUser;
    vi.mocked(useCreateWorkspaceMutation).mockReturnValue(
      createMutation(createWorkspaceMutateAsync) as unknown as ReturnType<
        typeof useCreateWorkspaceMutation
      >
    );
    vi.mocked(useCreateInviteCodeMutation).mockReturnValue(
      createMutation(createInviteCodeMutateAsync) as unknown as ReturnType<
        typeof useCreateInviteCodeMutation
      >
    );
  });

  it("초기 상태는 initial 단계, type 세부 단계다", () => {
    const { result } = renderHook(() => useWorkspaceSetupWizard());

    expect(result.current.step).toBe("initial");
    expect(result.current.createSubStep).toBe("type");
    expect(result.current.roomType).toBe("couple");
    expect(result.current.isMain).toBe(true);
  });

  it("startCreate 호출 시 create 단계로 이동한다", () => {
    const { result } = renderHook(() => useWorkspaceSetupWizard());

    act(() => result.current.startCreate());

    expect(result.current.step).toBe("create");
  });

  it("goToNameStep 호출 시 name 세부 단계로 이동하고 이름·생성ID를 초기화한다", () => {
    const { result } = renderHook(() => useWorkspaceSetupWizard());

    act(() => result.current.setWorkspaceName("이전 이름"));
    act(() => result.current.goToNameStep());

    expect(result.current.createSubStep).toBe("name");
    expect(result.current.workspaceName).toBe("");
  });

  it("completeCreate: 이름이 비어있으면 토스트를 띄우고 뮤테이션을 호출하지 않는다", async () => {
    const { result } = renderHook(() => useWorkspaceSetupWizard());

    await act(async () => {
      await result.current.completeCreate();
    });

    expect(toastActions.showToast).toHaveBeenCalledWith(
      expect.stringContaining("이름을 입력해주세요."),
      "error"
    );
    expect(createWorkspaceMutateAsync).not.toHaveBeenCalled();
  });

  it("completeCreate: user가 없으면 아무 동작도 하지 않는다", async () => {
    mockUserRef.current = undefined;
    const { result } = renderHook(() => useWorkspaceSetupWizard());

    act(() => result.current.setWorkspaceName("우리집"));
    await act(async () => {
      await result.current.completeCreate();
    });

    expect(createWorkspaceMutateAsync).not.toHaveBeenCalled();
  });

  it("completeCreate 성공 시 워크스페이스·초대코드 생성 후 invite 단계로 이동한다", async () => {
    createWorkspaceMutateAsync.mockResolvedValueOnce({ workspace: { id: "workspace-1" } });
    createInviteCodeMutateAsync.mockResolvedValueOnce("abc123");
    const { result } = renderHook(() => useWorkspaceSetupWizard());

    act(() => result.current.setWorkspaceName("우리집"));
    await act(async () => {
      await result.current.completeCreate();
    });

    expect(createWorkspaceMutateAsync).toHaveBeenCalledWith({
      name: "우리집",
      type: "couple",
      startDate: result.current.startDate,
    });
    expect(workspaceActions.setCurrentWorkspaceId).toHaveBeenCalledWith("workspace-1");
    expect(createInviteCodeMutateAsync).toHaveBeenCalledWith({ workspaceId: "workspace-1" });
    expect(result.current.inviteCode).toBe("abc123");
    expect(result.current.step).toBe("invite");
  });

  it("completeCreate 성공 시 isMain이 false면 현재 워크스페이스로 설정하지 않는다", async () => {
    createWorkspaceMutateAsync.mockResolvedValueOnce({ workspace: { id: "workspace-1" } });
    createInviteCodeMutateAsync.mockResolvedValueOnce("abc123");
    const { result } = renderHook(() => useWorkspaceSetupWizard());

    act(() => result.current.setWorkspaceName("우리집"));
    act(() => result.current.setIsMain(false));
    await act(async () => {
      await result.current.completeCreate();
    });

    expect(workspaceActions.setCurrentWorkspaceId).not.toHaveBeenCalled();
  });

  it("completeCreate 실패 시 오류 모달을 띄운다", async () => {
    createWorkspaceMutateAsync.mockRejectedValueOnce(new Error("fail"));
    const { result } = renderHook(() => useWorkspaceSetupWizard());

    act(() => result.current.setWorkspaceName("우리집"));
    await act(async () => {
      await result.current.completeCreate();
    });

    expect(modalActions.showModal).toHaveBeenCalledWith({
      type: "alert",
      title: "알림",
      message: "워크스페이스 생성 중 문제가 발생했습니다.",
    });
    expect(result.current.step).toBe("initial");
  });

  it("completeCreate: 워크스페이스 생성 후 초대코드 발급만 실패하면 재시도 시 워크스페이스를 재생성하지 않는다", async () => {
    createWorkspaceMutateAsync.mockResolvedValueOnce({ workspace: { id: "workspace-1" } });
    createInviteCodeMutateAsync.mockRejectedValueOnce(new Error("fail"));
    const { result } = renderHook(() => useWorkspaceSetupWizard());

    act(() => result.current.setWorkspaceName("우리집"));
    await act(async () => {
      await result.current.completeCreate();
    });
    expect(createWorkspaceMutateAsync).toHaveBeenCalledTimes(1);

    createInviteCodeMutateAsync.mockResolvedValueOnce("abc123");
    await act(async () => {
      await result.current.completeCreate();
    });

    expect(createWorkspaceMutateAsync).toHaveBeenCalledTimes(1);
    expect(createInviteCodeMutateAsync).toHaveBeenCalledWith({ workspaceId: "workspace-1" });
    expect(result.current.step).toBe("invite");
  });

  it("copyInviteLink: inviteCode가 없으면 아무 동작도 하지 않는다", async () => {
    const { result } = renderHook(() => useWorkspaceSetupWizard());

    await act(async () => {
      await result.current.copyInviteLink();
    });

    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it("copyInviteLink 성공 시 클립보드에 복사하고 성공 토스트를 띄운다", async () => {
    createWorkspaceMutateAsync.mockResolvedValueOnce({ workspace: { id: "workspace-1" } });
    createInviteCodeMutateAsync.mockResolvedValueOnce("abc123");
    const { result } = renderHook(() => useWorkspaceSetupWizard());

    act(() => result.current.setWorkspaceName("우리집"));
    await act(async () => {
      await result.current.completeCreate();
    });
    await act(async () => {
      await result.current.copyInviteLink();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://duous.app/invite/abc123");
    expect(toastActions.showToast).toHaveBeenCalledWith("초대 링크를 복사했습니다.", "success");
  });

  it("copyInviteLink 실패 시 에러 토스트를 띄운다", async () => {
    createWorkspaceMutateAsync.mockResolvedValueOnce({ workspace: { id: "workspace-1" } });
    createInviteCodeMutateAsync.mockResolvedValueOnce("abc123");
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error("fail"));
    const { result } = renderHook(() => useWorkspaceSetupWizard());

    act(() => result.current.setWorkspaceName("우리집"));
    await act(async () => {
      await result.current.completeCreate();
    });
    await act(async () => {
      await result.current.copyInviteLink();
    });

    expect(toastActions.showToast).toHaveBeenCalledWith(
      "복사에 실패했습니다. 코드를 직접 전달해주세요.",
      "error"
    );
  });

  it("goBack: create 단계의 name 세부 단계에서는 type 세부 단계로 되돌아간다", () => {
    const { result } = renderHook(() => useWorkspaceSetupWizard());

    act(() => result.current.startCreate());
    act(() => result.current.goToNameStep());
    act(() => result.current.goBack());

    expect(result.current.step).toBe("create");
    expect(result.current.createSubStep).toBe("type");
  });

  it("goBack: initial 단계에서는 router.back을 호출한다", () => {
    const { result } = renderHook(() => useWorkspaceSetupWizard());

    act(() => result.current.goBack());

    expect(mockBack).toHaveBeenCalled();
  });

  it("goBack: create 단계의 type 세부 단계(또는 invite 단계)에서는 initial 단계로 이동한다", () => {
    const { result } = renderHook(() => useWorkspaceSetupWizard());

    act(() => result.current.startCreate());
    act(() => result.current.goBack());

    expect(result.current.step).toBe("initial");
    expect(result.current.createSubStep).toBe("type");
  });

  it("skipInvite 호출 시 홈으로 이동한다", () => {
    const { result } = renderHook(() => useWorkspaceSetupWizard());

    act(() => result.current.skipInvite());

    expect(mockReplace).toHaveBeenCalledWith(ROUTES.HOME.path);
  });

  it("isSaving은 두 뮤테이션 중 하나라도 pending이면 true다", async () => {
    vi.mocked(useCreateInviteCodeMutation).mockReturnValue({
      mutateAsync: createInviteCodeMutateAsync,
      isPending: true,
    } as unknown as ReturnType<typeof useCreateInviteCodeMutation>);
    const { result } = renderHook(() => useWorkspaceSetupWizard());

    await waitFor(() => expect(result.current.isSaving).toBe(true));
  });

  it("inviteLink는 inviteCode가 없으면 빈 문자열이다", () => {
    const { result } = renderHook(() => useWorkspaceSetupWizard());

    expect(result.current.inviteLink).toBe("");
  });
});

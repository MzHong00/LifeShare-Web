import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { useProfileSettings } from "@/features/profile/hooks/useProfileSettings";
import { useProfileUser } from "@/features/profile/hooks/useProfileUser";
import { toastActions } from "@/stores/useToastStore";
import { SettingsView } from "./SettingsView";

vi.mock("@/features/profile/hooks/useProfileUser", () => ({
  useProfileUser: vi.fn(),
}));

vi.mock("@/features/profile/hooks/useProfileSettings", () => ({
  useProfileSettings: vi.fn(),
}));

vi.mock("@/stores/useToastStore", () => ({
  toastActions: { showToast: vi.fn() },
}));

vi.mock("@/components/layout/AppHeader", () => ({
  AppHeader: () => <header />,
}));

vi.mock("@/features/profile/components/ProfileHeroSkeleton", () => ({
  ProfileHeroSkeleton: () => <div data-testid="hero-skeleton" />,
}));

const mockUseProfileUser = vi.mocked(useProfileUser);
const mockUseProfileSettings = vi.mocked(useProfileSettings);

const settingsActions = {
  openEditNameModal: vi.fn(),
  changePhoto: vi.fn(),
  confirmLogout: vi.fn(),
};

/** useProfileUser 반환값을 원하는 상태로 세팅한다 */
const setProfileUserState = (state?: {
  profileImage?: string;
  email?: string;
  displayName?: string;
  isLoading?: boolean;
  isError?: boolean;
}) => {
  mockUseProfileUser.mockReturnValue({
    user: { id: "user-1", name: "홍길동", profileImage: state?.profileImage },
    email: state?.email ?? "me@test.com",
    displayName: state?.displayName ?? "홍길동",
    isLoading: state?.isLoading ?? false,
    isError: state?.isError ?? false,
  } as unknown as ReturnType<typeof useProfileUser>);
};

describe("SettingsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProfileSettings.mockReturnValue(
      settingsActions as unknown as ReturnType<typeof useProfileSettings>
    );
  });

  it("이름과 이메일을 렌더링한다", () => {
    setProfileUserState();

    render(<SettingsView />);

    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("me@test.com")).toBeInTheDocument();
  });

  it("로딩 중이면 히어로 스켈레톤을 렌더링한다", () => {
    setProfileUserState({ isLoading: true, displayName: "", email: "" });

    render(<SettingsView />);

    expect(screen.getByTestId("hero-skeleton")).toBeInTheDocument();
  });

  it("조회 실패 시 에러 안내를 렌더링한다", () => {
    setProfileUserState({ isError: true });

    render(<SettingsView />);

    expect(screen.getByText("프로필 정보를 불러오지 못했습니다.")).toBeInTheDocument();
    expect(screen.queryByTestId("hero-skeleton")).not.toBeInTheDocument();
  });

  it("설정 항목과 로그아웃 항목을 렌더링한다", () => {
    setProfileUserState();

    render(<SettingsView />);

    expect(screen.getByText("알림 설정")).toBeInTheDocument();
    expect(screen.getByText("위치 공유 설정")).toBeInTheDocument();
    expect(screen.getByText("로그아웃")).toBeInTheDocument();
  });

  it("준비 중인 설정 항목을 클릭하면 안내 토스트를 띄운다", () => {
    setProfileUserState();

    render(<SettingsView />);
    fireEvent.click(screen.getByText("알림 설정"));

    expect(toastActions.showToast).toHaveBeenCalledWith("알림 설정은(는) 준비 중입니다", "info");
  });

  it("로그아웃을 클릭하면 확인 모달을 띄우는 훅 동작을 호출한다", () => {
    setProfileUserState();

    render(<SettingsView />);
    fireEvent.click(screen.getByText("로그아웃"));

    expect(settingsActions.confirmLogout).toHaveBeenCalledTimes(1);
  });

  it("이름 버튼을 클릭하면 현재 이름과 입력 컨텐츠로 이름 수정 모달을 요청한다", () => {
    setProfileUserState();

    render(<SettingsView />);
    fireEvent.click(screen.getByText("홍길동"));

    expect(settingsActions.openEditNameModal).toHaveBeenCalledTimes(1);
    const [currentName, content, getName] = settingsActions.openEditNameModal.mock.calls[0];
    expect(currentName).toBe("홍길동");
    expect(content).toBeTruthy();
    expect(typeof getName).toBe("function");
  });

  it("이름 수정 모달의 getName은 입력값이 없으면 현재 이름을 반환한다", () => {
    setProfileUserState();

    render(<SettingsView />);
    fireEvent.click(screen.getByText("홍길동"));

    const getName = settingsActions.openEditNameModal.mock.calls[0][2] as () => string;
    expect(getName()).toBe("홍길동");
  });

  it("이름 입력값이 바뀌면 getName이 변경된 값을 반환한다", () => {
    setProfileUserState();

    render(<SettingsView />);
    fireEvent.click(screen.getByText("홍길동"));

    const [, content, getName] = settingsActions.openEditNameModal.mock.calls[0];
    render(content as React.ReactElement);
    fireEvent.change(screen.getByPlaceholderText("새 이름을 입력하세요"), {
      target: { value: "새이름" },
    });

    expect((getName as () => string)()).toBe("새이름");
  });

  it("파일을 선택하면 changePhoto를 호출한다", () => {
    setProfileUserState();

    const { container } = render(<SettingsView />);
    const fileInput = container.querySelector('input[type="file"]');
    fireEvent.change(fileInput as HTMLInputElement, {
      target: { files: [new File(["x"], "a.png", { type: "image/png" })] },
    });

    expect(settingsActions.changePhoto).toHaveBeenCalledTimes(1);
  });

  it("blob 미리보기 상태(업로드 중)면 아바타 버튼을 비활성화한다", () => {
    setProfileUserState({ profileImage: "blob:preview" });

    render(<SettingsView />);

    expect(screen.getByText("홍길동").closest("button")).toBeEnabled();
    expect(screen.getAllByRole("button")[0]).toBeDisabled();
  });

  it("업로드 중이 아니면 아바타 버튼이 활성화된다", () => {
    setProfileUserState({ profileImage: "https://cdn.test/a.png" });

    render(<SettingsView />);

    expect(screen.getAllByRole("button")[0]).toBeEnabled();
  });
});

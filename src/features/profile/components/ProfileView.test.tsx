import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ROUTES } from "@/constants/routes";
import { APP_VERSION } from "@/features/profile/constants/profile";
import { useProfileUser } from "@/features/profile/hooks/useProfileUser";
import { ProfileView } from "./ProfileView";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/features/profile/hooks/useProfileUser", () => ({
  useProfileUser: vi.fn(),
}));

vi.mock("./ProfileWorkspaceSection", () => ({
  ProfileWorkspaceSection: () => <section data-testid="workspace-section" />,
}));

vi.mock("./ProfileHeroSkeleton", () => ({
  ProfileHeroSkeleton: () => <div data-testid="hero-skeleton" />,
}));

const mockUseRouter = vi.mocked(useRouter);
const mockUseProfileUser = vi.mocked(useProfileUser);

/** useProfileUser 반환값을 원하는 상태로 세팅한다 */
const setProfileUserState = (state: {
  profileImage?: string;
  email?: string;
  displayName?: string;
  isLoading?: boolean;
  isError?: boolean;
}) => {
  mockUseProfileUser.mockReturnValue({
    user: { id: "user-1", name: "홍길동", profileImage: state.profileImage },
    email: state.email ?? "me@test.com",
    displayName: state.displayName ?? "홍길동",
    isLoading: state.isLoading ?? false,
    isError: state.isError ?? false,
  } as unknown as ReturnType<typeof useProfileUser>);
};

describe("ProfileView", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
  });

  it("이름과 이메일, 앱 버전을 렌더링한다", () => {
    setProfileUserState({});

    render(<ProfileView />);

    expect(screen.getByRole("heading", { level: 1, name: "홍길동" })).toBeInTheDocument();
    expect(screen.getByText("me@test.com")).toBeInTheDocument();
    expect(screen.getByText(APP_VERSION)).toBeInTheDocument();
  });

  it("로딩 중이면 히어로 스켈레톤을 렌더링한다", () => {
    setProfileUserState({ isLoading: true, displayName: "", email: "" });

    render(<ProfileView />);

    expect(screen.getByTestId("hero-skeleton")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("조회 실패 시 에러 안내를 렌더링한다", () => {
    setProfileUserState({ isError: true });

    render(<ProfileView />);

    expect(screen.getByText("프로필 정보를 불러오지 못했습니다.")).toBeInTheDocument();
    expect(screen.queryByTestId("hero-skeleton")).not.toBeInTheDocument();
  });

  it("설정 버튼을 클릭하면 설정 화면으로 이동한다", () => {
    setProfileUserState({});

    render(<ProfileView />);
    fireEvent.click(screen.getByLabelText("설정"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.PROFILE.SETTINGS.path);
  });

  it("알림 및 지원 메뉴 항목을 렌더링한다", () => {
    setProfileUserState({});

    render(<ProfileView />);

    expect(screen.getByText("알림 및 지원")).toBeInTheDocument();
    expect(screen.getByText("개인정보 처리방침")).toBeInTheDocument();
    expect(screen.getByText("공지사항")).toBeInTheDocument();
  });

  it("개인정보 처리방침 메뉴를 클릭하면 해당 화면으로 이동한다", () => {
    setProfileUserState({});

    render(<ProfileView />);
    fireEvent.click(screen.getByText("개인정보 처리방침"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.PROFILE.PRIVACY.path);
  });

  it("라이프룸 섹션을 함께 렌더링한다", () => {
    setProfileUserState({});

    render(<ProfileView />);

    expect(screen.getByTestId("workspace-section")).toBeInTheDocument();
  });
});

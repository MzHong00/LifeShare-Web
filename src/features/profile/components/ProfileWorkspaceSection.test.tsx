import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ROUTES } from "@/constants/routes";
import { useCurrentWorkspace } from "@/features/workspace/hooks/useCurrentWorkspace";
import { ProfileWorkspaceSection } from "./ProfileWorkspaceSection";

import type { Workspace } from "@/features/workspace/types/workspace";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/features/workspace/hooks/useCurrentWorkspace", () => ({
  useCurrentWorkspace: vi.fn(),
}));

vi.mock("@/components/ui/ProfileImage", () => ({
  ProfileImage: ({ name }: { name: string }) => <span data-testid="member-avatar">{name}</span>,
}));

const mockUseRouter = vi.mocked(useRouter);
const mockUseCurrentWorkspace = vi.mocked(useCurrentWorkspace);

const buildWorkspace = (id: string, overrides?: Partial<Workspace>): Workspace =>
  ({
    id,
    name: id,
    type: "couple",
    themeColor: "pink",
    members: [{ id: `${id}-m1`, name: "홍길동" }],
    ...overrides,
  }) as unknown as Workspace;

/** useCurrentWorkspace 반환값을 원하는 상태로 세팅한다 */
const setWorkspaceState = (state: {
  workspaces?: Workspace[];
  currentWorkspace?: Workspace | null;
}) => {
  mockUseCurrentWorkspace.mockReturnValue({
    workspaces: state.workspaces ?? [],
    currentWorkspace: state.currentWorkspace ?? null,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useCurrentWorkspace>);
};

describe("ProfileWorkspaceSection", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
  });

  it("참여 중인 라이프룸이 없으면 빈 상태 안내를 렌더링한다", () => {
    setWorkspaceState({ workspaces: [] });

    render(<ProfileWorkspaceSection />);

    expect(screen.getByText("참여 중인 라이프룸이 없어요")).toBeInTheDocument();
  });

  it("라이프룸 목록을 이름과 함께 렌더링한다", () => {
    setWorkspaceState({ workspaces: [buildWorkspace("우리집"), buildWorkspace("본가")] });

    render(<ProfileWorkspaceSection />);

    expect(screen.getByText("우리집")).toBeInTheDocument();
    expect(screen.getByText("본가")).toBeInTheDocument();
  });

  it("최대 3개까지만 노출한다", () => {
    setWorkspaceState({
      workspaces: ["a", "b", "c", "d"].map((id) => buildWorkspace(id)),
    });

    render(<ProfileWorkspaceSection />);

    expect(screen.queryByText("d")).not.toBeInTheDocument();
    expect(screen.getByText("c")).toBeInTheDocument();
  });

  it("메인 라이프룸을 맨 위로 올리고 메인 배지를 붙인다", () => {
    const main = buildWorkspace("본가");
    setWorkspaceState({
      workspaces: [buildWorkspace("우리집"), main],
      currentWorkspace: main,
    });

    render(<ProfileWorkspaceSection />);

    const rows = screen.getAllByRole("button");

    expect(rows[1]).toHaveTextContent("본가");
    expect(rows[1]).toHaveTextContent("메인");
    expect(screen.getAllByText("메인")).toHaveLength(1);
  });

  it("메인 라이프룸이 없으면 메인 배지를 렌더링하지 않는다", () => {
    setWorkspaceState({ workspaces: [buildWorkspace("우리집")] });

    render(<ProfileWorkspaceSection />);

    expect(screen.queryByText("메인")).not.toBeInTheDocument();
  });

  it("상세보기를 클릭하면 라이프룸 목록 화면으로 이동한다", () => {
    setWorkspaceState({ workspaces: [buildWorkspace("우리집")] });

    render(<ProfileWorkspaceSection />);
    fireEvent.click(screen.getByText("상세보기"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.WORKSPACE.LIST.path);
  });

  it("라이프룸 행을 클릭하면 해당 라이프룸 설정 화면으로 이동한다", () => {
    setWorkspaceState({ workspaces: [buildWorkspace("우리집")] });

    render(<ProfileWorkspaceSection />);
    fireEvent.click(screen.getByText("우리집"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.WORKSPACE.EDIT.query({ workspaceId: "우리집" }));
  });

  it("멤버 아바타는 최대 3개까지 역순으로 렌더링한다", () => {
    setWorkspaceState({
      workspaces: [
        buildWorkspace("우리집", {
          members: [
            { id: "m1", name: "일" },
            { id: "m2", name: "이" },
            { id: "m3", name: "삼" },
            { id: "m4", name: "사" },
          ],
        } as unknown as Partial<Workspace>),
      ],
    });

    render(<ProfileWorkspaceSection />);

    expect(screen.getAllByTestId("member-avatar").map((node) => node.textContent)).toEqual([
      "사",
      "삼",
      "이",
    ]);
  });

  it("멤버가 없으면 아바타 스택을 렌더링하지 않는다", () => {
    setWorkspaceState({
      workspaces: [buildWorkspace("우리집", { members: [] } as unknown as Partial<Workspace>)],
    });

    render(<ProfileWorkspaceSection />);

    expect(screen.queryByTestId("member-avatar")).not.toBeInTheDocument();
  });
});

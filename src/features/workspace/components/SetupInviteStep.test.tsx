import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { SetupInviteStep } from "./SetupInviteStep";

import type { RoomType } from "@/features/workspace/types/workspace";

describe("SetupInviteStep", () => {
  const onCopyCode = vi.fn();
  const onCopyLink = vi.fn();

  /** 기본 props로 렌더링한다 */
  const renderStep = (roomType: RoomType = "couple") =>
    render(
      <SetupInviteStep
        workspaceName="우리집"
        roomType={roomType}
        inviteCode="K7M2-P9QX"
        onCopyCode={onCopyCode}
        onCopyLink={onCopyLink}
      />
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("couple 유형이면 파트너 문구를 사용한다", () => {
    renderStep("couple");

    expect(screen.getByRole("heading", { name: "파트너 초대하기" })).toBeInTheDocument();
    expect(screen.getByText(/파트너에게/)).toBeInTheDocument();
  });

  it("group 유형이면 멤버 문구를 사용한다", () => {
    renderStep("group");

    expect(screen.getByRole("heading", { name: "멤버 초대하기" })).toBeInTheDocument();
    expect(screen.getByText(/멤버에게/)).toBeInTheDocument();
  });

  it("전달받은 초대 코드를 표시한다", () => {
    renderStep();

    expect(screen.getByText("K7M2-P9QX")).toBeInTheDocument();
  });

  it("워크스페이스 이름을 안내 문구에 포함한다", () => {
    renderStep();

    expect(screen.getByText(/우리집이\(가\) 생성되었습니다!/)).toBeInTheDocument();
  });

  it("코드 복사 버튼 클릭 시 onCopyCode를 호출한다", () => {
    renderStep();
    fireEvent.click(screen.getByRole("button", { name: "코드 복사" }));

    expect(onCopyCode).toHaveBeenCalledTimes(1);
  });

  it("링크 복사 버튼 클릭 시 onCopyLink를 호출한다", () => {
    renderStep();
    fireEvent.click(screen.getByRole("button", { name: "링크 복사" }));

    expect(onCopyLink).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MemberListContent } from "./MemberListContent";

import type { WorkspaceMember } from "@/features/workspace/types/workspace";

const members = [
  { id: "user-1", name: "홍길동", email: "me@test.com", role: "owner" },
  { id: "user-2", name: "파트너", email: "partner@test.com", role: "member" },
] as unknown as WorkspaceMember[];

describe("MemberListContent", () => {
  it("멤버가 없으면 빈 상태 안내를 렌더링한다", () => {
    render(<MemberListContent members={[]} />);

    expect(screen.getByText("참여자가 없어요")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("멤버의 이름과 이메일을 모두 렌더링한다", () => {
    render(<MemberListContent members={members} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("me@test.com")).toBeInTheDocument();
    expect(screen.getByText("파트너")).toBeInTheDocument();
    expect(screen.getByText("partner@test.com")).toBeInTheDocument();
  });
});

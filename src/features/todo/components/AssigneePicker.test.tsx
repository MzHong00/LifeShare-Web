import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { AssigneePicker } from "./AssigneePicker";

import type { WorkspaceMember } from "@/features/workspace/types/workspace";

const members = [
  { id: "user-1", name: "홍길동", email: "me@test.com", role: "owner" },
  { id: "user-2", name: "파트너", email: "partner@test.com", role: "member" },
] as unknown as WorkspaceMember[];

describe("AssigneePicker", () => {
  const onSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("공통 옵션과 멤버 목록을 함께 렌더링한다", () => {
    render(<AssigneePicker members={members} onSelect={onSelect} />);

    expect(screen.getByText("공통")).toBeInTheDocument();
    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("파트너")).toBeInTheDocument();
  });

  it("멤버가 없으면 공통 옵션만 렌더링한다", () => {
    render(<AssigneePicker members={[]} onSelect={onSelect} />);

    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByText("공통")).toBeInTheDocument();
  });

  it("멤버를 클릭하면 해당 멤버 id로 onSelect를 호출한다", () => {
    render(<AssigneePicker members={members} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("파트너"));

    expect(onSelect).toHaveBeenCalledWith("user-2");
  });

  it("공통을 클릭하면 undefined로 onSelect를 호출한다", () => {
    render(<AssigneePicker members={members} assigneeId="user-1" onSelect={onSelect} />);
    fireEvent.click(screen.getByText("공통"));

    expect(onSelect).toHaveBeenCalledWith(undefined);
  });

  it("assigneeId가 없으면 공통 라벨을 활성 스타일로 표시한다", () => {
    render(<AssigneePicker members={members} onSelect={onSelect} />);

    expect(screen.getByText("공통").className).not.toBe(screen.getByText("홍길동").className);
  });

  it("선택된 멤버 라벨만 활성 스타일로 표시한다", () => {
    render(<AssigneePicker members={members} assigneeId="user-1" onSelect={onSelect} />);

    expect(screen.getByText("파트너").className).toBe(screen.getByText("공통").className);
    expect(screen.getByText("홍길동").className).not.toBe(screen.getByText("파트너").className);
  });
});

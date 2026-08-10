import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChatHeader } from "./ChatHeader";

import type { WorkspaceMember } from "@/features/workspace/types/workspace";

/** 워크스페이스 멤버 목업을 만든다 */
const createMember = (id: string, name: string, avatar?: string) =>
  ({ id, name, avatar, email: `${id}@test.com`, role: "member" }) as unknown as WorkspaceMember;

describe("ChatHeader", () => {
  it("상대가 1명이면 상대 이름을 그대로 렌더링한다", () => {
    render(<ChatHeader partners={[createMember("user-2", "파트너")]} />);

    expect(screen.getByText("파트너")).toBeInTheDocument();
  });

  it("상대가 여러 명이면 첫 멤버 외 N명으로 요약한다", () => {
    render(
      <ChatHeader
        partners={[
          createMember("user-2", "파트너"),
          createMember("user-3", "친구"),
          createMember("user-4", "동생"),
        ]}
      />
    );

    expect(screen.getByText("파트너 외 2명")).toBeInTheDocument();
  });

  it("상대 전원의 프로필 이미지를 렌더링한다", () => {
    render(
      <ChatHeader
        partners={[
          createMember("user-2", "파트너", "https://cdn.test/a.png"),
          createMember("user-3", "친구", "https://cdn.test/b.png"),
        ]}
      />
    );

    expect(screen.getByAltText("파트너")).toBeInTheDocument();
    expect(screen.getByAltText("친구")).toBeInTheDocument();
  });

  it("아바타 uri가 없으면 이름 이니셜 폴백을 렌더링한다", () => {
    render(<ChatHeader partners={[createMember("user-2", "파트너")]} />);

    expect(screen.queryByAltText("파트너")).not.toBeInTheDocument();
    expect(screen.getByText("파")).toBeInTheDocument();
  });

  it("상대가 없으면 이름 영역을 비워둔다", () => {
    render(<ChatHeader partners={[]} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

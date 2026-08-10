import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { StoryItem } from "./StoryItem";

import type { Story } from "@/features/stories/types/story";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill: _fill, sizes: _sizes, alt, ...rest } = props;
    return <img alt={typeof alt === "string" ? alt : ""} {...rest} />;
  },
}));

const story: Story = {
  id: "story-1",
  title: "첫번째 기억",
  date: "2026-01-02T00:00:00.000Z",
  path: [],
  pathColor: "#3182f6",
  userId: "user-1",
  workspaceId: "ws-1",
};

describe("StoryItem", () => {
  const onPress = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("제목과 날짜를 렌더링한다", () => {
    render(<StoryItem story={story} onPress={onPress} />);

    expect(screen.getByText("첫번째 기억")).toBeInTheDocument();
    expect(screen.getByText("2026.01.02")).toBeInTheDocument();
  });

  it("썸네일이 있으면 이미지를 렌더링한다", () => {
    render(
      <StoryItem
        story={{ ...story, thumbnailUrl: "https://example.com/a.png" }}
        onPress={onPress}
      />
    );

    expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/a.png");
  });

  it("썸네일이 없으면 이미지 대신 플레이스홀더 아이콘을 렌더링한다", () => {
    render(<StoryItem story={story} onPress={onPress} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("항목을 클릭하면 스토리 id로 onPress를 호출한다", () => {
    render(<StoryItem story={story} onPress={onPress} />);
    fireEvent.click(screen.getByRole("button"));

    expect(onPress).toHaveBeenCalledWith("story-1");
  });
});

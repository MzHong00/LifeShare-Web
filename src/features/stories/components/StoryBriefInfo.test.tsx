import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StoryBriefInfo } from "./StoryBriefInfo";

import type { Story } from "@/features/stories/types/story";

const story: Story = {
  id: "story-1",
  title: "제주 여행",
  date: "2026-03-05T00:00:00.000Z",
  path: [],
  pathColor: "#3182f6",
  userId: "user-1",
  workspaceId: "ws-1",
};

describe("StoryBriefInfo", () => {
  it("제목과 날짜를 렌더링한다", () => {
    render(<StoryBriefInfo story={story} />);

    expect(screen.getByRole("heading", { name: "제주 여행" })).toBeInTheDocument();
    expect(screen.getByText("2026.03.05")).toBeInTheDocument();
  });

  it("경로가 있으면 지점 개수를 렌더링한다", () => {
    render(
      <StoryBriefInfo
        story={{
          ...story,
          path: [
            { latitude: 1, longitude: 2, timestamp: 1 },
            { latitude: 3, longitude: 4, timestamp: 2 },
          ],
        }}
      />
    );

    expect(screen.getByText("경로 2개 지점")).toBeInTheDocument();
  });

  it("경로가 없으면 지점 개수를 렌더링하지 않는다", () => {
    render(<StoryBriefInfo story={story} />);

    expect(screen.queryByText(/개 지점/)).not.toBeInTheDocument();
  });

  it("날짜가 비어 있으면 날짜 텍스트를 비워 렌더링한다", () => {
    render(<StoryBriefInfo story={{ ...story, date: "" }} />);

    expect(screen.queryByText(/\d{4}\.\d{2}\.\d{2}/)).not.toBeInTheDocument();
  });
});

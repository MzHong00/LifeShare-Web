import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { StoryPathField } from "./StoryPathField";

import type { LocationPoint } from "@/features/stories/types/story";

vi.mock("@/features/map/components/PathPreview", () => ({
  PathPreview: ({
    path,
    onEdit,
    onClear,
  }: {
    path: LocationPoint[];
    pathColor: string;
    onEdit: () => void;
    onClear: () => void;
  }) => (
    <div data-testid="path-preview">
      <span>정점 {path.length}개</span>
      <button onClick={onEdit}>경로 수정</button>
      <button onClick={onClear}>경로 삭제</button>
    </div>
  ),
}));

const path: LocationPoint[] = [
  { latitude: 37.1, longitude: 127.1, timestamp: 1 },
  { latitude: 37.2, longitude: 127.2, timestamp: 2 },
];

describe("StoryPathField", () => {
  const onEdit = vi.fn();
  const onClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("경로가 없으면 경로 추가 플레이스홀더를 렌더링한다", () => {
    render(<StoryPathField path={[]} pathColor="#3182f6" onEdit={onEdit} onClear={onClear} />);

    expect(screen.getByText("경로 추가하기")).toBeInTheDocument();
    expect(screen.queryByTestId("path-preview")).not.toBeInTheDocument();
  });

  it("플레이스홀더를 클릭하면 onEdit을 호출한다", () => {
    render(<StoryPathField path={[]} pathColor="#3182f6" onEdit={onEdit} onClear={onClear} />);
    fireEvent.click(screen.getByText("경로 추가하기"));

    expect(onEdit).toHaveBeenCalled();
  });

  it("경로가 있으면 경로 미리보기를 렌더링한다", () => {
    render(<StoryPathField path={path} pathColor="#3182f6" onEdit={onEdit} onClear={onClear} />);

    expect(screen.getByTestId("path-preview")).toBeInTheDocument();
    expect(screen.getByText("정점 2개")).toBeInTheDocument();
  });

  it("미리보기의 초기화 동작이 onClear로 연결된다", () => {
    render(<StoryPathField path={path} pathColor="#3182f6" onEdit={onEdit} onClear={onClear} />);
    fireEvent.click(screen.getByText("경로 삭제"));

    expect(onClear).toHaveBeenCalled();
    expect(onEdit).not.toHaveBeenCalled();
  });
});

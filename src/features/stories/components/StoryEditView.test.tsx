import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { useStoryForm } from "@/features/stories/hooks/useStoryForm";
import { StoryEditView } from "./StoryEditView";

import type { LocationPoint } from "@/features/stories/types/story";

vi.mock("@/features/stories/hooks/useStoryForm", () => ({ useStoryForm: vi.fn() }));

vi.mock("@/components/layout/AppHeader", () => ({ AppHeader: () => <header /> }));

// Google Maps SDK 의존 컴포넌트라 테스트에서는 지연 로딩 대신 더미로 치환한다
vi.mock("next/dynamic", () => ({
  default: () => {
    const PathPickerMapStub = ({
      onConfirm,
      onClose,
    }: {
      onConfirm: (path: LocationPoint[], color: string) => void;
      onClose: () => void;
    }) => (
      <div data-testid="path-picker">
        <button onClick={() => onConfirm([{ latitude: 1, longitude: 2, timestamp: 3 }], "#ff0000")}>
          경로 확인
        </button>
        <button onClick={onClose}>지도 닫기</button>
      </div>
    );
    return PathPickerMapStub;
  },
}));

const mockUseStoryForm = vi.mocked(useStoryForm);

const setTitle = vi.fn();
const setDescription = vi.fn();
const setDate = vi.fn();
const setPath = vi.fn();
const setIsPathPickerOpen = vi.fn();
const handleImageSelect = vi.fn();
const handleRemoveImage = vi.fn();
const handlePathConfirm = vi.fn();
const handleSave = vi.fn();

/** useStoryForm 반환값을 원하는 상태로 세팅한다 */
const setup = (overrides?: Partial<ReturnType<typeof useStoryForm>>) => {
  mockUseStoryForm.mockReturnValue({
    isEditMode: false,
    fileInputRef: { current: null },
    title: "",
    setTitle,
    description: "",
    setDescription,
    date: "2026-03-05",
    setDate,
    previewUrl: undefined,
    pathColor: "#3182f6",
    path: [],
    setPath,
    isPathPickerOpen: false,
    setIsPathPickerOpen,
    isSaving: false,
    handleImageSelect,
    handleRemoveImage,
    handlePathConfirm,
    handleSave,
    ...overrides,
  } as unknown as ReturnType<typeof useStoryForm>);
};

describe("StoryEditView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date("2026-03-05T09:00:00.000Z"));
  });

  it("작성 모드면 저장 버튼에 기록하기를 표시한다", () => {
    setup();

    render(<StoryEditView />);

    expect(screen.getByText("기록하기")).toBeInTheDocument();
  });

  it("수정 모드면 저장 버튼에 수정하기를 표시한다", () => {
    setup({ isEditMode: true });

    render(<StoryEditView />);

    expect(screen.getByText("수정하기")).toBeInTheDocument();
  });

  it("수정 모드에서는 폼 초기값으로 기존 스토리 값을 렌더링한다", () => {
    setup({
      isEditMode: true,
      title: "제주 여행",
      description: "바다가 예뻤다",
      date: "2026-01-02",
    });

    render(<StoryEditView />);

    expect(screen.getByDisplayValue("제주 여행")).toBeInTheDocument();
    expect(screen.getByDisplayValue("바다가 예뻤다")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-01-02")).toBeInTheDocument();
  });

  it("제목·내용·날짜를 입력하면 각 상태 setter를 호출한다", () => {
    setup();

    render(<StoryEditView />);
    fireEvent.change(screen.getByPlaceholderText("어떤 기억인가요? (선택)"), {
      target: { value: "제주 여행" },
    });
    fireEvent.change(screen.getByPlaceholderText("그날의 이야기를 들려주세요 (선택)"), {
      target: { value: "바다가 예뻤다" },
    });
    fireEvent.change(screen.getByDisplayValue("2026-03-05"), { target: { value: "2026-04-01" } });

    expect(setTitle).toHaveBeenCalledWith("제주 여행");
    expect(setDescription).toHaveBeenCalledWith("바다가 예뻤다");
    expect(setDate).toHaveBeenCalledWith("2026-04-01");
  });

  it("저장 버튼을 클릭하면 handleSave를 호출한다", () => {
    setup();

    render(<StoryEditView />);
    fireEvent.click(screen.getByText("기록하기"));

    expect(handleSave).toHaveBeenCalled();
  });

  it("저장 중이면 저장 버튼을 비활성화하고 저장 중 문구를 표시한다", () => {
    setup({ isSaving: true });

    render(<StoryEditView />);

    const button = screen.getByText("저장 중...");
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleSave).not.toHaveBeenCalled();
  });

  it("경로 추가하기를 클릭하면 경로 선택 지도를 연다", () => {
    setup();

    render(<StoryEditView />);
    expect(screen.queryByTestId("path-picker")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("경로 추가하기"));

    expect(setIsPathPickerOpen).toHaveBeenCalledWith(true);
  });

  it("경로 선택 지도에서 확인하면 handlePathConfirm을 호출한다", () => {
    setup({ isPathPickerOpen: true });

    render(<StoryEditView />);
    fireEvent.click(screen.getByText("경로 확인"));

    expect(handlePathConfirm).toHaveBeenCalledWith(
      [{ latitude: 1, longitude: 2, timestamp: 3 }],
      "#ff0000"
    );
  });

  it("경로 선택 지도를 닫으면 지도 표시 상태를 해제한다", () => {
    setup({ isPathPickerOpen: true });

    render(<StoryEditView />);
    fireEvent.click(screen.getByText("지도 닫기"));

    expect(setIsPathPickerOpen).toHaveBeenCalledWith(false);
  });

  it("이미지 제거 버튼을 클릭하면 handleRemoveImage를 호출한다", () => {
    setup({ previewUrl: "blob:preview" });

    render(<StoryEditView />);
    fireEvent.click(screen.getByLabelText("사진 제거"));

    expect(handleRemoveImage).toHaveBeenCalled();
  });
});

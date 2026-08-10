import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { createRef } from "react";

import { StoryImagePicker } from "./StoryImagePicker";

describe("StoryImagePicker", () => {
  const onSelect = vi.fn();
  const onRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("미리보기가 없으면 사진 추가 버튼을 렌더링한다", () => {
    render(
      <StoryImagePicker
        fileInputRef={createRef<HTMLInputElement>()}
        onSelect={onSelect}
        onRemove={onRemove}
      />
    );

    expect(screen.getByLabelText("사진 추가하기")).toBeInTheDocument();
    expect(screen.queryByAltText("선택한 스토리 사진")).not.toBeInTheDocument();
  });

  it("사진 추가 버튼을 클릭하면 파일 입력을 대신 클릭한다", () => {
    const fileInputRef = createRef<HTMLInputElement>();

    render(
      <StoryImagePicker fileInputRef={fileInputRef} onSelect={onSelect} onRemove={onRemove} />
    );
    const clickSpy = vi.spyOn(fileInputRef.current as HTMLInputElement, "click");
    fireEvent.click(screen.getByLabelText("사진 추가하기"));

    expect(clickSpy).toHaveBeenCalled();
  });

  it("파일을 선택하면 onSelect를 호출한다", () => {
    const fileInputRef = createRef<HTMLInputElement>();

    render(
      <StoryImagePicker fileInputRef={fileInputRef} onSelect={onSelect} onRemove={onRemove} />
    );
    fireEvent.change(fileInputRef.current as HTMLInputElement, {
      target: { files: [new File(["a"], "a.png", { type: "image/png" })] },
    });

    expect(onSelect).toHaveBeenCalled();
  });

  it("미리보기가 있으면 썸네일과 제거 버튼을 렌더링한다", () => {
    render(
      <StoryImagePicker
        previewUrl="blob:preview"
        fileInputRef={createRef<HTMLInputElement>()}
        onSelect={onSelect}
        onRemove={onRemove}
      />
    );

    expect(screen.getByAltText("선택한 스토리 사진")).toHaveAttribute("src", "blob:preview");
    expect(screen.queryByLabelText("사진 추가하기")).not.toBeInTheDocument();
  });

  it("제거 버튼을 클릭하면 onRemove를 호출한다", () => {
    render(
      <StoryImagePicker
        previewUrl="blob:preview"
        fileInputRef={createRef<HTMLInputElement>()}
        onSelect={onSelect}
        onRemove={onRemove}
      />
    );
    fireEvent.click(screen.getByLabelText("사진 제거"));

    expect(onRemove).toHaveBeenCalled();
  });
});

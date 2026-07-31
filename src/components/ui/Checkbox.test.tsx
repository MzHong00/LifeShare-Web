import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("label을 렌더링한다", () => {
    render(<Checkbox label="약관 동의" isChecked={false} onPress={vi.fn()} />);

    expect(screen.getByText("약관 동의")).toBeInTheDocument();
  });

  it("isChecked가 true면 체크 아이콘을 표시한다", () => {
    const { container } = render(<Checkbox label="약관 동의" isChecked={true} onPress={vi.fn()} />);

    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("isChecked가 false면 체크 아이콘을 표시하지 않는다", () => {
    const { container } = render(
      <Checkbox label="약관 동의" isChecked={false} onPress={vi.fn()} />
    );

    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("클릭 시 onPress가 호출된다", () => {
    const onPress = vi.fn();
    render(<Checkbox label="약관 동의" isChecked={false} onPress={onPress} />);

    fireEvent.click(screen.getByRole("button"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("isDisabled면 버튼이 비활성화되고 클릭해도 onPress가 호출되지 않는다", () => {
    const onPress = vi.fn();
    render(<Checkbox label="약관 동의" isChecked={false} onPress={onPress} isDisabled />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});

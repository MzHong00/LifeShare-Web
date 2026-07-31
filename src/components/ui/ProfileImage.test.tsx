import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProfileImage } from "./ProfileImage";

describe("ProfileImage", () => {
  it("uri가 없으면 이름 이니셜 폴백을 표시한다", () => {
    render(<ProfileImage name="민수" />);

    expect(screen.getByText("민")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("name이 빈 문자열이면 '?' 폴백을 표시한다", () => {
    render(<ProfileImage name="" />);

    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("동일한 이름은 항상 동일한 배경색을 갖는다", () => {
    const getBgColor = () => {
      const { container } = render(<ProfileImage name="지민" />);
      return container.querySelector("span")!.parentElement!.style.backgroundColor;
    };

    expect(getBgColor()).toBe(getBgColor());
  });

  it("uri가 있으면 이미지를 렌더링한다", () => {
    render(<ProfileImage name="지민" uri="https://example.com/a.png" />);

    expect(screen.getByRole("img")).toBeInTheDocument();
  });
});

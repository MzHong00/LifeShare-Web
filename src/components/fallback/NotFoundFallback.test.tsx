import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ROUTES } from "@/constants/routes";

import { NotFoundFallback } from "./NotFoundFallback";

describe("NotFoundFallback", () => {
  it("404 제목과 안내 문구를 렌더링한다", () => {
    render(<NotFoundFallback />);

    expect(screen.getByRole("heading", { name: "페이지를 찾을 수 없어요" })).toBeInTheDocument();
    expect(screen.getByText("주소가 바뀌었거나 존재하지 않는 페이지예요.")).toBeInTheDocument();
  });

  it("홈으로 돌아가기 링크가 홈 경로를 가리킨다", () => {
    render(<NotFoundFallback />);

    expect(screen.getByRole("link", { name: "홈으로 돌아가기" })).toHaveAttribute(
      "href",
      ROUTES.HOME.path
    );
  });
});

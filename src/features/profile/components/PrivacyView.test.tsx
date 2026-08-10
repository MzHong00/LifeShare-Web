import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { APP_BRAND_NAME } from "@/constants/config";
import { PrivacyView } from "./PrivacyView";

vi.mock("@/components/layout/AppHeader", () => ({
  AppHeader: () => <header />,
}));

describe("PrivacyView", () => {
  it("개인정보 처리방침 제목과 브랜드명을 렌더링한다", () => {
    render(<PrivacyView />);

    expect(
      screen.getByRole("heading", { level: 2, name: "개인정보 처리방침" })
    ).toBeInTheDocument();
    expect(screen.getByText(new RegExp(APP_BRAND_NAME.KR))).toBeInTheDocument();
  });

  it("네 개의 조항 소제목을 순서대로 렌더링한다", () => {
    render(<PrivacyView />);

    const headings = screen.getAllByRole("heading", { level: 3 }).map((node) => node.textContent);

    expect(headings).toEqual([
      "1. 수집하는 개인정보 항목",
      "2. 개인정보의 수집 및 이용 목적",
      "3. 개인정보의 보유 및 이용 기간",
      "4. 개인정보의 파기",
    ]);
  });

  it("시행일과 버전 정보를 렌더링한다", () => {
    render(<PrivacyView />);

    expect(screen.getByText(/시행일: 2024년 1월 1일/)).toBeInTheDocument();
    expect(screen.getByText(/버전: 1.0/)).toBeInTheDocument();
  });
});

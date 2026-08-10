import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChatPartnerEmpty } from "./ChatPartnerEmpty";

describe("ChatPartnerEmpty", () => {
  it("파트너가 없다는 안내 문구를 렌더링한다", () => {
    render(<ChatPartnerEmpty />);

    expect(screen.getByText("아직 파트너가 없어요")).toBeInTheDocument();
    expect(screen.getByText(/둘만의 대화가 여기서 시작돼요/)).toBeInTheDocument();
  });

  it("장식용 이모지는 스크린리더에서 숨긴다", () => {
    render(<ChatPartnerEmpty />);

    expect(screen.getByText("💌")).toHaveAttribute("aria-hidden", "true");
  });
});

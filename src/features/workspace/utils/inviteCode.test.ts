import { describe, expect, it, vi } from "vitest";

import {
  generateInviteCode,
  normalizeInviteCode,
  formatInviteCode,
  isValidInviteCodeFormat,
  generateInviteLink,
} from "@/features/workspace/utils/inviteCode";

describe("generateInviteCode", () => {
  it("허용 문자만으로 8자리 코드를 만든다", () => {
    for (let i = 0; i < 100; i += 1) {
      expect(isValidInviteCodeFormat(generateInviteCode())).toBe(true);
    }
  });

  it("헷갈리는 I·L·O·U를 포함하지 않는다", () => {
    const codes = Array.from({ length: 100 }, generateInviteCode).join("");

    expect(codes).not.toMatch(/[ILOU]/);
  });
});

describe("normalizeInviteCode", () => {
  it("소문자·하이픈·공백을 흡수해 저장 형태로 되돌린다", () => {
    expect(normalizeInviteCode("k7m2-p9qx")).toBe("K7M2P9QX");
    expect(normalizeInviteCode(" K7M2 P9QX ")).toBe("K7M2P9QX");
  });

  it("혼동하기 쉬운 I·L·O를 숫자로 교정한다", () => {
    expect(normalizeInviteCode("il0o1234")).toBe("11001234");
  });
});

describe("formatInviteCode", () => {
  it("4자리 단위로 하이픈을 넣어 표시한다", () => {
    expect(formatInviteCode("K7M2P9QX")).toBe("K7M2-P9QX");
  });
});

describe("isValidInviteCodeFormat", () => {
  it("길이가 다르거나 허용되지 않은 문자가 있으면 거부한다", () => {
    expect(isValidInviteCodeFormat("K7M2P9Q")).toBe(false);
    expect(isValidInviteCodeFormat("K7M2P9QXZ")).toBe(false);
    expect(isValidInviteCodeFormat("K7M2P9QU")).toBe(false);
    expect(isValidInviteCodeFormat("k7m2p9qx")).toBe(false);
  });
});

describe("generateInviteLink", () => {
  it("현재 origin과 초대 코드로 참여 링크를 만든다", () => {
    vi.stubGlobal("location", { origin: "https://duous.app" });

    expect(generateInviteLink("K7M2P9QX")).toBe("https://duous.app/workspace/join/K7M2P9QX");

    vi.unstubAllGlobals();
  });
});

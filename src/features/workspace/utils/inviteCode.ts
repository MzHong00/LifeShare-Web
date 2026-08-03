import { ROUTES } from "@/constants/routes";

// 초대 코드 알파벳 (Crockford Base32) — 손으로 옮겨 적을 때 헷갈리는 I·L·O·U를 제외한 32글자
const INVITE_CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const INVITE_CODE_LENGTH = 8; // 초대 코드 길이 (32^8 ≈ 1.1조 조합)
const INVITE_CODE_GROUP_SIZE = 4; // 화면 표시 시 하이픈으로 끊는 단위

// 입력 정규화 시 원래 글자로 되돌릴 혼동 문자 (Crockford 규칙: I·L→1, O→0)
const CONFUSABLE_CHAR_MAP: Record<string, string> = { I: "1", L: "1", O: "0" };

const INVITE_CODE_PATTERN = new RegExp(`^[${INVITE_CODE_ALPHABET}]{${INVITE_CODE_LENGTH}}$`);

/**
 * 새 초대 코드를 생성한다.
 * 모듈러 편향이 없도록 알파벳 길이(32)로 정확히 나누어떨어지는 바이트 값만 사용한다.
 */
export const generateInviteCode = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(INVITE_CODE_LENGTH));
  return Array.from(bytes, (byte) => INVITE_CODE_ALPHABET[byte % INVITE_CODE_ALPHABET.length]).join(
    ""
  );
};

/**
 * 사용자가 입력한 문자열을 저장 형태의 코드로 정규화한다.
 * 대소문자·하이픈·공백을 흡수하고, 헷갈리기 쉬운 I·L·O는 숫자로 교정한다.
 */
export const normalizeInviteCode = (raw: string) =>
  raw
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/[ILO]/g, (char) => CONFUSABLE_CHAR_MAP[char]);

/** 정규화된 코드를 화면 표시용(K7M2-P9QX)으로 끊어준다 */
export const formatInviteCode = (code: string) =>
  code.replace(new RegExp(`.{${INVITE_CODE_GROUP_SIZE}}(?=.)`, "g"), "$&-");

/** 정규화된 코드가 발급 가능한 형식인지 검사한다 (서버 조회 전 1차 차단용) */
export const isValidInviteCodeFormat = (code: string) => INVITE_CODE_PATTERN.test(code);

/** 초대 코드로 참여 링크를 만든다 (브라우저 전용 — window.location에 의존한다) */
export const generateInviteLink = (code: string) =>
  `${window.location.origin}${ROUTES.WORKSPACE.join(code)}`;

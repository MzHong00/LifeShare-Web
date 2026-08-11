/** 객체 배열에서 특정 키의 문자열 값들을 " · "로 이어붙인다 (빈 값·excludeValue는 제외) */
export const joinValuesWithDot = <T extends object>(
  arr: T[] | undefined,
  key: keyof T,
  excludeValue?: string
): string => {
  if (!arr) return "";
  return arr
    .map((item) => {
      const value = item[key];
      return typeof value === "string" ? value : "";
    })
    .filter((val) => val !== "" && val !== excludeValue)
    .join(" · ");
};

/** 이름의 첫 글자를 대문자로 반환한다(공백만 있으면 "?" 폴백) */
export const getInitials = (name: string): string => {
  const trimmed = name.trim(); // 공백만 있는 이름도 빈 값으로 취급해 "?" 폴백을 노출
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
};

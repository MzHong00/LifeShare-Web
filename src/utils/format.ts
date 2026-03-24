export const joinValuesWithDot = <T extends object>(
  arr: T[] | undefined,
  key: keyof T,
  excludeValue?: string
): string => {
  if (!arr) return "";
  return arr
    .map((item) => item[key] as string)
    .filter((val) => val !== excludeValue)
    .join(" · ");
};

export const getInitials = (name: string): string => {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
};

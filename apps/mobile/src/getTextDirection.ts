export type TextDirection = "ltr" | "rtl";

export function getTextDirection(text: string): TextDirection {
  let arabicCount = 0;
  let latinCount = 0;

  for (const character of text) {
    if (/\p{Script=Arabic}/u.test(character)) arabicCount += 1;
    else if (/\p{Script=Latin}/u.test(character)) latinCount += 1;
  }

  return arabicCount > latinCount ? "rtl" : "ltr";
}

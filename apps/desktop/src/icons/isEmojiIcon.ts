const MAX_ICON_LENGTH = 32;
const pictograph = /\p{Extended_Pictographic}/u;
const flag = /^\p{Regional_Indicator}{2}$/u;
const keycap = /^[#*0-9]\uFE0F?\u20E3$/u;

/** True only for one native emoji grapheme cluster. */
export function isEmojiIcon(value: string): boolean {
  if (
    value.length === 0 ||
    value.length > MAX_ICON_LENGTH ||
    (!pictograph.test(value) && !flag.test(value) && !keycap.test(value))
  ) {
    return false;
  }

  const segments = [
    ...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(
      value,
    ),
  ];
  return segments.length === 1 && segments[0]?.segment === value;
}

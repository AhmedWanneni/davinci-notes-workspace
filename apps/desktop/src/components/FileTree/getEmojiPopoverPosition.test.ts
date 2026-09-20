// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { getEmojiPopoverPosition } from "./getEmojiPopoverPosition";

describe("getEmojiPopoverPosition", () => {
  it("keeps the picker inside the viewport", () => {
    Object.defineProperty(window, "innerWidth", { value: 800 });
    Object.defineProperty(window, "innerHeight", { value: 600 });

    expect(getEmojiPopoverPosition(790, 590)).toEqual({ left: 468, top: 198 });
  });
});

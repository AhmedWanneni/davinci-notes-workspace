import {
  createFileCardId,
  createTextCardId,
  snapToGrid,
} from "./canvasConstants";

describe("canvasConstants", () => {
  it("snaps values to the nearest grid line", () => {
    expect(snapToGrid(25, 24)).toBe(24);
    expect(snapToGrid(37, 24)).toBe(48);
  });

  it("creates unique text card ids", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "uuid-123" });
    expect(createTextCardId()).toBe("text-uuid-123");
    expect(createFileCardId()).toBe("file-uuid-123");
    vi.unstubAllGlobals();
  });
});

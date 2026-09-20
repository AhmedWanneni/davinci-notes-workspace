import { describe, expect, it } from "vitest";
import {
  getMappedIcon,
  parseIconMap,
  removeMappedIcon,
  serializeIconMap,
  setMappedIcon,
} from "./iconMap";

describe("icon map", () => {
  it("sets, retrieves, and removes validated icons", () => {
    const set = setMappedIcon({}, "folder/canvas.canvas", "🚀");
    expect(getMappedIcon(set, "folder/canvas.canvas")).toBe("🚀");
    expect(removeMappedIcon(set, "folder/canvas.canvas")).toEqual({});
  });

  it("recovers safely from corrupt data and serializes stable keys", () => {
    expect(parseIconMap("not json")).toEqual({});
    expect(serializeIconMap({ z: "🚀", a: "🇹🇳" })).toBe(
      '{\n  "a": "🇹🇳",\n  "z": "🚀"\n}\n',
    );
  });
});

import type { CanvasData } from "./CanvasData";
import { parseCanvas } from "./parseCanvas";
import {
  serializeCanvas,
  type SerializeCanvasOptions,
} from "./serializeCanvas";

export interface CanvasFsAdapter {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
}

async function getNodeFsAdapter(): Promise<CanvasFsAdapter> {
  const fs = await import("node:fs/promises");
  return {
    readFile: (filePath: string) => fs.readFile(filePath, "utf-8"),
    writeFile: (filePath: string, content: string) =>
      fs.writeFile(filePath, content, "utf-8"),
  };
}

/**
 * Reads and parses a `.canvas` JSON file from disk using the provided or default filesystem adapter.
 */
export async function readCanvasFile(
  filePath: string,
  adapter?: CanvasFsAdapter,
): Promise<CanvasData> {
  const fsAdapter = adapter ?? (await getNodeFsAdapter());
  const rawContent = await fsAdapter.readFile(filePath);
  return parseCanvas(rawContent);
}

/**
 * Validates, serializes, and writes a `.canvas` JSON file to disk using the provided or default filesystem adapter.
 */
export async function writeCanvasFile(
  filePath: string,
  data: CanvasData,
  adapter?: CanvasFsAdapter,
  options?: SerializeCanvasOptions,
): Promise<void> {
  const fsAdapter = adapter ?? (await getNodeFsAdapter());
  const serialized = serializeCanvas(data, options);
  await fsAdapter.writeFile(filePath, serialized);
}

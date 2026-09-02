interface ZipEntry {
  path: string;
  data: Uint8Array;
}

function read32(view: DataView, offset: number): number {
  return view.getUint32(offset, true);
}
function read16(view: DataView, offset: number): number {
  return view.getUint16(offset, true);
}

export async function unzipPluginArchive(
  bytes: Uint8Array,
): Promise<ZipEntry[]> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (
    let offset = bytes.length - 22;
    offset >= Math.max(0, bytes.length - 65557);
    offset--
  ) {
    if (read32(view, offset) === 0x06054b50) {
      end = offset;
      break;
    }
  }
  if (end < 0) throw new Error("Plugin release is not a ZIP archive");
  const count = read16(view, end + 10);
  const directorySize = read32(view, end + 12);
  const directoryOffset = read32(view, end + 16);
  const entries: ZipEntry[] = [];
  let cursor = directoryOffset;
  for (let index = 0; index < count; index++) {
    if (read32(view, cursor) !== 0x02014b50)
      throw new Error("Invalid ZIP directory");
    const method = read16(view, cursor + 10);
    const compressedSize = read32(view, cursor + 20);
    const nameLength = read16(view, cursor + 28);
    const extraLength = read16(view, cursor + 30);
    const commentLength = read16(view, cursor + 32);
    const localOffset = read32(view, cursor + 42);
    const path = new TextDecoder().decode(
      bytes.slice(cursor + 46, cursor + 46 + nameLength),
    );
    if (!path || path.endsWith("/")) {
      cursor += 46 + nameLength + extraLength + commentLength;
      continue;
    }
    const localNameLength = read16(view, localOffset + 26);
    const localExtraLength = read16(view, localOffset + 28);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(start, start + compressedSize);
    let data: Uint8Array;
    if (method === 0) data = compressed;
    else if (method === 8) data = await decompressDeflate(compressed);
    else throw new Error(`Unsupported ZIP compression method: ${method}`);
    entries.push({ path, data });
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  if (cursor !== directoryOffset + directorySize)
    throw new Error("Invalid ZIP directory size");
  return entries;
}

async function decompressDeflate(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined")
    throw new Error("ZIP decompression is unavailable");
  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const result = await reader.read();
    if (result.done) break;
    chunks.push(result.value);
    size += result.value.length;
  }
  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

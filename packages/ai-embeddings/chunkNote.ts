export interface NoteChunk {
  id: string;
  notePath: string;
  heading: string | null;
  startLine: number;
  endLine: number;
  text: string;
}

const MAX_CHARS = 2_000;

function splitParagraph(text: string, startLine: number): NoteChunk[] {
  const chunks: NoteChunk[] = [];
  for (let offset = 0; offset < text.length; offset += MAX_CHARS) {
    const part = text.slice(offset, offset + MAX_CHARS);
    const line = startLine + text.slice(0, offset).split("\n").length - 1;
    chunks.push({
      id: `${line}:${line + part.split("\n").length - 1}:${offset}`,
      notePath: "",
      heading: null,
      startLine: line,
      endLine: line + part.split("\n").length - 1,
      text: part,
    });
  }
  return chunks;
}

export function chunkNote(notePath: string, content: string): NoteChunk[] {
  const lines = content.split("\n");
  const chunks: NoteChunk[] = [];
  let heading: string | null = null;
  let paragraph: string[] = [];
  let paragraphStart = 1;

  const flush = (endLine: number) => {
    const text = paragraph.join("\n").trim();
    if (!text) return;
    const parts = splitParagraph(text, paragraphStart);
    parts.forEach((part, index) => {
      const section = heading ?? "root";
      chunks.push({
        ...part,
        id: `${notePath}#${section}:${part.id}:${index}`,
        notePath,
        heading,
        endLine: Math.max(part.endLine, endLine),
      });
    });
    paragraph = [];
  };

  lines.forEach((line, index) => {
    if (/^#{1,6}\s+/.test(line)) {
      flush(index);
      heading = line.replace(/^#{1,6}\s+/, "").trim();
      paragraphStart = index + 2;
    } else if (line.trim() === "") {
      flush(index);
      paragraphStart = index + 2;
    } else {
      if (paragraph.length === 0) paragraphStart = index + 1;
      paragraph.push(line);
    }
  });
  flush(lines.length);
  return chunks;
}

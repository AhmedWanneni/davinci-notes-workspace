import type { ChatAttachmentItem } from "./agentTypes";

export async function fileToChatAttachment(
  file: File,
): Promise<ChatAttachmentItem> {
  const url = URL.createObjectURL(file);
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return {
    id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: file.name,
    mimeType: file.type || "image/png",
    url,
    data,
  };
}

export function isVisionSupported(modelName?: string): boolean {
  if (!modelName) return true;
  const lower = modelName.toLowerCase();
  // Models that don't support vision
  if (lower.includes("deepseek-r1") || lower.includes("gemma-2") || lower.includes("llama-3-8b")) {
    return false;
  }
  return true;
}

/**
 * Lightweight UTF-8 safe base64 encoding and decoding for webview bridging.
 * Prevents control character injection and template literal expansion corruption
 * across the react-native-webview bridge on Android.
 */

export function encodePayload(str: string): string {
  if (!str) return "";
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const b64 = typeof btoa !== "undefined" ? btoa(binary) : "";
    return b64 ? `b64:${b64}` : str;
  } catch {
    return str;
  }
}

export function decodePayload(payload: string): string {
  if (!payload || !payload.startsWith("b64:")) return payload ?? "";
  try {
    const raw = payload.slice(4);
    if (typeof atob !== "undefined") {
      const binary = atob(raw);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    }
    return payload;
  } catch {
    return payload;
  }
}

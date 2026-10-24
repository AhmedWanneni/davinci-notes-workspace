/**
 * A per-clip identity used for desktop-side dedupe (ADR-0178). Not a secret, so
 * `randomUUID` is enough; the fallback keeps the code working in contexts
 * without `crypto.randomUUID`.
 */
export function newClipId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  const random = Math.random().toString(36).slice(2, 12);
  return `clip-${Date.now().toString(36)}-${random}`;
}

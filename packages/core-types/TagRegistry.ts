import {
  decomposeTag,
  normalizeTag,
  normalizeTagBody,
} from "./parseTag.js";
import type { Tag } from "./Tag.js";

/** First-seen casing registry for case-insensitive tag identities. */
export class TagRegistry {
  private readonly entries = new Map<string, Tag>();

  register(value: string): Tag {
    const key = normalizeTag(value);
    const existing = this.entries.get(key);
    if (existing) return existing;
    const segments = value.slice(1).split("/");
    const tag: Tag = { key, display: value, segments };
    this.entries.set(key, tag);
    return tag;
  }

  registerBody(value: string): Tag {
    const key = normalizeTagBody(value);
    const existing = this.entries.get(key);
    if (existing) return existing;
    const tag: Tag = {
      key,
      display: `#${value}`,
      segments: value.split("/"),
    };
    this.entries.set(key, tag);
    return tag;
  }

  get(value: string): Tag | undefined {
    return this.entries.get(normalizeTag(value));
  }

  getBody(value: string): Tag | undefined {
    return this.entries.get(normalizeTagBody(value));
  }

  ancestors(value: string): Tag[] {
    return decomposeTag(value).map((ancestor) => this.register(ancestor));
  }

  ancestorsBody(value: string): Tag[] {
    const segments = value.split("/");
    if (segments.some((segment) => segment.length === 0)) {
      throw new Error(`Invalid nested tag body: ${value}`);
    }
    return segments.map((_, index) =>
      this.registerBody(segments.slice(0, index + 1).join("/")),
    );
  }

  values(): Tag[] {
    return [...this.entries.values()];
  }
}

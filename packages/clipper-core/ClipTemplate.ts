/**
 * A clip template is *data*, never code (ADR-0176): JSON-serializable, importable,
 * validated before use. It uses the documented reference fields adapted to our
 * stack, minus logic/Interpreter.
 */
import type { ClipBehavior } from "./ClipPayload.js";

export interface ClipTemplateProperty {
  /** Frontmatter property name (validated as YAML-safe on emission). */
  name: string;
  /** A template string; may use `{{variable|filter}}`. */
  value: string;
}

export interface ClipTemplate {
  id: string;
  name: string;
  behavior: ClipBehavior;
  /** Template string for the note name (without `.md`). */
  noteNameFormat: string;
  /** Vault-relative folder, `/`-separated. May be empty (vault root). */
  folder: string;
  /** Optional target vault name; absent => the currently open vault. */
  vault?: string;
  properties: ClipTemplateProperty[];
  tags: string[];
  /** Note body template. */
  body: string;
  /** Auto-apply rules: URL prefix, `/regex/`, or `schema:@Type`. */
  triggers: string[];
}

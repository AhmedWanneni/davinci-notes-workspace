import type { ClipTemplate } from "@app/clipper-core";

/** Facts about the current page that auto-apply rules can match on. */
export interface TriggerContext {
  url: string;
  schemaTypes: string[];
}

const SCHEMA_PREFIX = "schema:";

function matchesTrigger(trigger: string, context: TriggerContext): boolean {
  const trimmed = trigger.trim();
  if (trimmed.length === 0) return false;

  if (trimmed.toLowerCase().startsWith(SCHEMA_PREFIX)) {
    const type = trimmed.slice(SCHEMA_PREFIX.length).replace(/^@/, "");
    return context.schemaTypes.some(
      (candidate) => candidate.toLowerCase() === type.toLowerCase(),
    );
  }

  const regex = /^\/(.+)\/([gimsuy]*)$/.exec(trimmed);
  if (regex) {
    try {
      return new RegExp(regex[1], regex[2]).test(context.url);
    } catch {
      // An invalid pattern in an imported template matches nothing, never throws.
      return false;
    }
  }

  return context.url.startsWith(trimmed);
}

/**
 * First matching template wins, so template order is meaningful and a
 * user-imported template placed earlier overrides a starter.
 */
export function matchTemplate(
  templates: readonly ClipTemplate[],
  context: TriggerContext,
): ClipTemplate | undefined {
  for (const template of templates) {
    if (template.triggers.some((trigger) => matchesTrigger(trigger, context))) {
      return template;
    }
  }
  return undefined;
}

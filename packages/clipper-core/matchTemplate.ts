import type { ClipTemplate } from "./ClipTemplate.js";
import {
  MAX_TRIGGER_URL_LENGTH,
  parseTriggerRule,
  type TriggerRule,
} from "./triggerRule.js";

/** Facts about the current page that auto-apply rules can match on. */
export interface TriggerContext {
  url: string;
  schemaTypes: string[];
}

function ruleMatches(rule: TriggerRule, context: TriggerContext): boolean {
  if (rule.kind === "schema") {
    return context.schemaTypes.some(
      (candidate) => candidate.toLowerCase() === rule.type.toLowerCase(),
    );
  }

  // Cap before testing: the page chose the URL length, we choose the work.
  const url = context.url.slice(0, MAX_TRIGGER_URL_LENGTH);
  if (rule.kind === "prefix") return url.startsWith(rule.prefix);

  try {
    return new RegExp(rule.source, rule.flags).test(url);
  } catch {
    // A pattern that is somehow unusable matches nothing, never throws.
    return false;
  }
}

/** A rule that does not parse matches nothing, rather than throwing. */
export function matchesTrigger(
  trigger: string,
  context: TriggerContext,
): boolean {
  const parsed = parseTriggerRule(trigger);
  return parsed.status === "ok" && ruleMatches(parsed.rule, context);
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

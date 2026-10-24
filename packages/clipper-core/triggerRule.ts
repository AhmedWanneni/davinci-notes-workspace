/**
 * Auto-apply rules: a URL prefix, a `/regex/`, or `schema:@Type` (plan §4).
 *
 * A rule is typed by a user or imported from a file, and it runs against a URL
 * the page chose, so both halves are bounded here: a pattern must be a shape we
 * can run without pathological backtracking, and the URL it is tested against is
 * capped first (the app caps a URL at the same 2048 characters).
 */

/** Longest rule we accept. Anything longer is a mistake, not a rule. */
export const MAX_TRIGGER_LENGTH = 512;

/** Longest regex source we accept. */
export const MAX_REGEX_SOURCE_LENGTH = 256;

/** Longest URL slice a rule is ever tested against. */
export const MAX_TRIGGER_URL_LENGTH = 2048;

const SCHEMA_PREFIX = "schema:";
const REGEX_FORM = /^\/(.+)\/([gimsuy]*)$/;
const REPEAT = /^\{\d*,?\d*\}/;

export type TriggerRule =
  | { kind: "schema"; type: string }
  | { kind: "regex"; source: string; flags: string }
  | { kind: "prefix"; prefix: string };

export type TriggerRuleParse =
  | { status: "ok"; rule: TriggerRule }
  | { status: "empty" }
  | { status: "invalid"; reason: string };

/**
 * Read one rule. Anything that is not a rule is reported, never coerced: a
 * silently unparsed trigger would look like a rule that never applies.
 */
export function parseTriggerRule(raw: string): TriggerRuleParse {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { status: "empty" };
  if (trimmed.length > MAX_TRIGGER_LENGTH) {
    return {
      status: "invalid",
      reason: `is longer than ${MAX_TRIGGER_LENGTH} characters`,
    };
  }

  if (trimmed.toLowerCase().startsWith(SCHEMA_PREFIX)) {
    const type = trimmed.slice(SCHEMA_PREFIX.length).replace(/^@/, "");
    if (type.length === 0) {
      return { status: "invalid", reason: 'names no type after "schema:@"' };
    }
    return { status: "ok", rule: { kind: "schema", type } };
  }

  if (trimmed.startsWith("/")) {
    const match = REGEX_FORM.exec(trimmed);
    if (match === null) {
      return {
        status: "invalid",
        reason:
          'starts with "/" but is not a closed /pattern/ with s, i, m, g, u or y flags',
      };
    }
    const source = match[1];
    const flags = match[2];
    if (source.length > MAX_REGEX_SOURCE_LENGTH) {
      return {
        status: "invalid",
        reason: `pattern is longer than ${MAX_REGEX_SOURCE_LENGTH} characters`,
      };
    }
    if (hasNestedQuantifier(source)) {
      return {
        status: "invalid",
        reason:
          "repeats a group that itself repeats or alternates, which can hang the browser; split it into two rules",
      };
    }
    try {
      new RegExp(source, flags);
    } catch {
      return { status: "invalid", reason: "is not a valid regular expression" };
    }
    return { status: "ok", rule: { kind: "regex", source, flags } };
  }

  return { status: "ok", rule: { kind: "prefix", prefix: trimmed } };
}

/** The reason a rule cannot be used, or `undefined` when it parses. */
export function triggerRuleError(raw: string): string | undefined {
  const parsed = parseTriggerRule(raw);
  if (parsed.status === "ok") return undefined;
  return parsed.status === "empty" ? "is empty" : parsed.reason;
}

/**
 * A quantifier applied to a group that itself repeats or alternates (`(a+)+`,
 * `(a|aa)+`) is the shape behind catastrophic backtracking, which would freeze
 * the popup on a hostile page.
 *
 * This is a deliberate heuristic, not a proof: it refuses the classic shapes and
 * a regex that still backtracks is bounded only by the capped URL. Recorded as an
 * open decision rather than claimed as a guarantee.
 */
function hasNestedQuantifier(source: string): boolean {
  // Whether the group currently open contains a repetition or an alternation.
  const openGroups: boolean[] = [];
  let groupIsRepeating = false;
  let previousWasQuantifier = false;
  let escaped = false;
  let inClass = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (escaped) {
      escaped = false;
      previousWasQuantifier = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (inClass) {
      if (char === "]") inClass = false;
      continue;
    }
    if (char === "[") {
      inClass = true;
      previousWasQuantifier = false;
      continue;
    }
    if (char === "(") {
      openGroups.push(groupIsRepeating);
      groupIsRepeating = false;
      previousWasQuantifier = false;
      continue;
    }
    if (char === ")" || char === "|") {
      const outer = openGroups.pop() ?? false;
      if (char === ")") {
        // A `?` straight after a group is its modifier, not a repetition.
        const next = source[index + 1];
        const repeats = next === "*" || next === "+" || next === "?";
        if (repeats && groupIsRepeating) return true;
        if (
          next === "{" &&
          groupIsRepeating &&
          REPEAT.test(source.slice(index + 1))
        ) {
          return true;
        }
        groupIsRepeating = groupIsRepeating || outer;
      } else {
        // Alternation is the other half of the shape: keep tracking it inward.
        groupIsRepeating = true;
        openGroups.push(outer);
      }
      previousWasQuantifier = false;
      continue;
    }
    if (char === "*" || char === "+") {
      if (previousWasQuantifier) return true;
      previousWasQuantifier = true;
      groupIsRepeating = true;
      continue;
    }
    if (char === "?") {
      // `(?:`, `(?=`, `(?<name>`: a group modifier, never a repetition.
      if (source[index - 1] === "(" && !previousWasQuantifier) {
        previousWasQuantifier = false;
        continue;
      }
      if (previousWasQuantifier) {
        // A lazy or possessive mark (`a*?`) is not a nested quantifier.
        previousWasQuantifier = false;
        continue;
      }
      previousWasQuantifier = true;
      groupIsRepeating = true;
      continue;
    }
    if (char === "{") {
      const match = REPEAT.exec(source.slice(index));
      if (match !== null) {
        if (previousWasQuantifier) return true;
        previousWasQuantifier = true;
        groupIsRepeating = true;
        index += match[0].length - 1;
        continue;
      }
    }
    previousWasQuantifier = false;
  }

  return false;
}

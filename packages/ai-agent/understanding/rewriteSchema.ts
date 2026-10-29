export interface StructuredUserRequest {
  goal: string;
  intent: string;
  target: string | null;
  constraints: string[];
  ambiguities: string[];
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function validateStructuredUserRequest(
  data: unknown,
): ValidationResult<StructuredUserRequest> {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { success: false, error: "Root must be an object" };
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.goal !== "string" || !obj.goal.trim()) {
    return { success: false, error: "'goal' must be a non-empty string" };
  }

  if (typeof obj.intent !== "string" || !obj.intent.trim()) {
    return { success: false, error: "'intent' must be a non-empty string" };
  }

  let target: string | null = null;
  if (obj.target !== null && obj.target !== undefined) {
    if (typeof obj.target !== "string") {
      return { success: false, error: "'target' must be a string or null" };
    }
    const trimmed = obj.target.trim();
    target =
      trimmed.length > 0 && trimmed.toLowerCase() !== "null" ? trimmed : null;
  }

  if (!Array.isArray(obj.constraints)) {
    return { success: false, error: "'constraints' must be an array of strings" };
  }
  for (const c of obj.constraints) {
    if (typeof c !== "string") {
      return { success: false, error: "Each constraint must be a string" };
    }
  }

  if (!Array.isArray(obj.ambiguities)) {
    return { success: false, error: "'ambiguities' must be an array of strings" };
  }
  for (const a of obj.ambiguities) {
    if (typeof a !== "string") {
      return { success: false, error: "Each ambiguity must be a string" };
    }
  }

  return {
    success: true,
    data: {
      goal: obj.goal.trim(),
      intent: obj.intent.trim(),
      target,
      constraints: obj.constraints.map((c) => String(c).trim()).filter(Boolean),
      ambiguities: obj.ambiguities.map((a) => String(a).trim()).filter(Boolean),
    },
  };
}

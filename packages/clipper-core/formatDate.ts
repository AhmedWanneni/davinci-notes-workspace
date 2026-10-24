/**
 * Minimal date formatting without a date library.
 *
 * Supports the tokens the reference documents for the common case:
 * `YYYY YY MM M DD D HH H mm m ss s`. Parsing is limited to formats built from
 * the same tokens, which covers `YYYY-MM-DD` and `MM/DD/YYYY`.
 */
import type { FilterFunction } from "./filterTypes.js";

const TOKEN_PATTERN = /YYYY|YY|MM|M|DD|D|HH|H|mm|m|ss|s/g;

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

function tokenValue(date: Date, token: string): string {
  switch (token) {
    case "YYYY":
      return String(date.getFullYear());
    case "YY":
      return pad(date.getFullYear() % 100);
    case "MM":
      return pad(date.getMonth() + 1);
    case "M":
      return String(date.getMonth() + 1);
    case "DD":
      return pad(date.getDate());
    case "D":
      return String(date.getDate());
    case "HH":
      return pad(date.getHours());
    case "H":
      return String(date.getHours());
    case "mm":
      return pad(date.getMinutes());
    case "m":
      return String(date.getMinutes());
    case "ss":
      return pad(date.getSeconds());
    case "s":
      return String(date.getSeconds());
    default:
      return token;
  }
}

export function formatDate(date: Date, format: string): string {
  return format.replace(TOKEN_PATTERN, (token) => tokenValue(date, token));
}

export function parseDateInput(
  value: string,
  inputFormat?: string,
): Date | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;

  // A bare `YYYY-MM-DD` must be interpreted in local time: `new Date("2026-10-17")`
  // is UTC midnight and would render as the previous day west of UTC.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!inputFormat && dateOnly) {
    return new Date(
      Number.parseInt(dateOnly[1], 10),
      Number.parseInt(dateOnly[2], 10) - 1,
      Number.parseInt(dateOnly[3], 10),
    );
  }

  const native = new Date(trimmed);
  if (inputFormat === undefined && !Number.isNaN(native.getTime())) {
    return native;
  }

  if (inputFormat) {
    const tokens: string[] = [];
    let pattern = "^";
    let cursor = 0;
    for (const match of inputFormat.matchAll(TOKEN_PATTERN)) {
      const index = match.index ?? 0;
      pattern += escapeRegExp(inputFormat.slice(cursor, index));
      pattern += "(\\d+)";
      tokens.push(match[0]);
      cursor = index + match[0].length;
    }
    pattern += escapeRegExp(inputFormat.slice(cursor)) + "$";

    const match = new RegExp(pattern).exec(trimmed);
    if (!match) return undefined;

    const parts: Record<string, number> = {};
    tokens.forEach((token, index) => {
      parts[token] = Number.parseInt(match[index + 1], 10);
    });
    const year = parts.YYYY ?? parts.YY ?? new Date().getFullYear();
    const date = new Date(
      year,
      (parts.MM ?? parts.M ?? 1) - 1,
      parts.DD ?? parts.D ?? 1,
      parts.HH ?? parts.H ?? 0,
      parts.mm ?? parts.m ?? 0,
      parts.ss ?? parts.s ?? 0,
    );
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  return Number.isNaN(native.getTime()) ? undefined : native;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const dateFilter: FilterFunction = (value, args, runtime) => {
  const outputFormat = (args[0] as string | undefined) ?? "YYYY-MM-DD";
  const inputFormat = args[1] as string | undefined;

  if (value === undefined || value === null || value === "") {
    return formatDate(runtime.now, outputFormat);
  }
  if (value instanceof Date) {
    return formatDate(value, outputFormat);
  }
  const parsed = parseDateInput(String(value), inputFormat);
  return formatDate(parsed ?? runtime.now, outputFormat);
};

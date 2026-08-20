import { isValidTag } from "@app/core-types";

export interface TagSearchClause {
  kind: "tag";
  tagKey: string;
}

export interface CustomSearchClause {
  kind: string;
  value: string;
  [key: string]: unknown;
}

export type SearchOperatorClause = TagSearchClause | CustomSearchClause;

export interface SearchQueryClause {
  excluded: boolean;
  value: string;
  phrase: boolean;
  operator?: SearchOperatorClause;
}

export interface SearchQueryError {
  token: string;
  message: string;
}

export interface ParsedSearchQuery {
  clauses: SearchQueryClause[];
  errors: SearchQueryError[];
}

export type SearchOperatorHandler = (
  value: string,
  excluded: boolean,
) => SearchOperatorClause | undefined;

export type SearchOperatorRegistry = ReadonlyMap<
  string,
  SearchOperatorHandler
>;

const TAG_OPERATOR = "tag";

function tokenize(query: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < query.length; index += 1) {
    const character = query[index];
    if (character === '"') {
      quoted = !quoted;
      current += character;
    } else if (/\s/.test(character) && !quoted) {
      if (current) tokens.push(current);
      current = "";
    } else {
      current += character;
    }
  }

  if (current) tokens.push(current);
  return tokens;
}

function unwrapPhrase(token: string): { value: string; phrase: boolean } {
  if (token.length >= 2 && token.startsWith('"') && token.endsWith('"')) {
    return { value: token.slice(1, -1), phrase: true };
  }
  return { value: token, phrase: false };
}

function createTagClause(value: string): TagSearchClause | undefined {
  const tagKey = value.startsWith("#") ? value.slice(1) : value;
  if (!isValidTag(`#${tagKey}`)) return undefined;
  return { kind: TAG_OPERATOR, tagKey: tagKey.toLowerCase() };
}

export function createDefaultSearchOperatorRegistry(): SearchOperatorRegistry {
  return new Map([[TAG_OPERATOR, (value) => createTagClause(value)]]) as SearchOperatorRegistry;
}

function parseToken(
  token: string,
  registry: SearchOperatorRegistry,
  errors: SearchQueryError[],
): SearchQueryClause | undefined {
  let excluded = false;
  let source = token;
  if (source.startsWith("-") && source.length > 1) {
    excluded = true;
    source = source.slice(1);
  }

  const { value, phrase } = unwrapPhrase(source);
  const separator = phrase ? -1 : value.indexOf(":");
  if (separator <= 0) {
    if (!value) return undefined;
    return { excluded, value, phrase };
  }

  const name = value.slice(0, separator).toLowerCase();
  const operatorValue = value.slice(separator + 1);
  const handler = registry.get(name);
  if (!handler) {
    return { excluded, value, phrase: false };
  }
  if (!operatorValue) {
    errors.push({ token, message: `Operator ${name}: requires a value` });
    return undefined;
  }

  const operator = handler(operatorValue, excluded);
  if (!operator) {
    errors.push({ token, message: `Invalid value for ${name}:` });
    return undefined;
  }
  return { excluded, value: operatorValue, phrase: false, operator };
}

export function parseSearchQuery(
  query: string,
  registry: SearchOperatorRegistry = createDefaultSearchOperatorRegistry(),
): ParsedSearchQuery {
  const errors: SearchQueryError[] = [];
  const clauses = tokenize(query)
    .map((token) => parseToken(token, registry, errors))
    .filter((clause): clause is SearchQueryClause => clause !== undefined);
  return { clauses, errors };
}

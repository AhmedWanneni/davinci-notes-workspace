import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";

export interface AutocompleteExtensionOptions {
  notePaths: readonly string[];
}

export function autocompleteExtension(options: AutocompleteExtensionOptions) {
  return (context: CompletionContext): CompletionResult | null => {
    // Match anything starting with [[ and not closed or piped
    const before = context.matchBefore(/\[\[([^\]|]*)$/);
    if (!before) {
      return null;
    }

    const query = before.text.slice(2).toLowerCase();

    // Suggest note titles based on filename stems
    const suggestions = options.notePaths.map((path) => {
      const stem = path.replace(/\.md$/i, "").split("/").pop() ?? path;
      const directory = path.includes("/")
        ? path.slice(0, path.lastIndexOf("/"))
        : "";

      return {
        label: stem,
        detail: directory ? `in ${directory}/` : undefined,
        // When applied, replace from the start of the query to the cursor and close with ]]
        apply: stem + "]]",
      };
    });

    // Filter suggestions by match
    const filtered = suggestions.filter((s) =>
      s.label.toLowerCase().includes(query),
    );

    return {
      from: before.from + 2, // Keep the "[[" and replace what comes after
      options: filtered,
      filter: false, // We manually filter to ensure clean matching
    };
  };
}

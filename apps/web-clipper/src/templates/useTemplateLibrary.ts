import { useCallback, useEffect, useRef, useState } from "react";
import {
  validateClipTemplate,
  type ClipTemplate,
  type ClipTemplateProperty,
} from "@app/clipper-core";
import {
  appendTemplate,
  copyTemplate,
  freshTemplate,
  removeTemplate,
  replaceTemplate,
  withAddedProperty,
  withPropertyAt,
  withoutPropertyAt,
} from "./templateDraft";
import {
  defaultTemplateLibraryDeps,
  type TemplateLibraryDeps,
} from "./templateLibraryDeps";
import { defaultTemplates } from "./templateStore";
import { parseTemplateImport } from "./templateTransfer";
export interface TemplateLibraryController {
  loading: boolean;
  templates: readonly ClipTemplate[];
  selectedId?: string;
  /** The template being edited; `undefined` until storage has been read. */
  draft?: ClipTemplate;
  /** Whether the draft differs from what is stored. */
  dirty: boolean;
  /** Why the draft cannot be saved, in the validator's words. */
  errors: readonly string[];
  saving: boolean;
  notice?: string;
  failure?: string;
  select(id: string): void;
  create(): void;
  duplicate(): void;
  remove(): void;
  restoreStarters(): void;
  importTemplates(text: string): void;
  patch(changes: Partial<ClipTemplate>): void;
  setProperty(index: number, changes: Partial<ClipTemplateProperty>): void;
  addProperty(): void;
  removeProperty(index: number): void;
  save(): void;
  discard(): void;
}
/** Manage stored templates. Draft edits reach storage only after validation. */
export function useTemplateLibrary(
  deps: TemplateLibraryDeps = defaultTemplateLibraryDeps,
): TemplateLibraryController {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<readonly ClipTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [draft, setDraft] = useState<ClipTemplate>();
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<readonly string[]>([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [failure, setFailure] = useState<string>();
  // A re-created dependency object must not re-read storage.
  const depsRef = useRef(deps);
  depsRef.current = deps;
  const open = useCallback(
    (next: readonly ClipTemplate[], id: string | undefined) => {
      setTemplates(next);
      setSelectedId(id);
      const found = next.find((candidate) => candidate.id === id);
      setDraft(found === undefined ? undefined : copyTemplate(found));
      setDirty(false);
      setErrors([]);
    },
    [],
  );
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const loaded = await depsRef.current.load();
        if (cancelled) return;
        open(loaded, loaded[0]?.id);
      } catch (cause) {
        if (cancelled) return;
        setFailure(
          cause instanceof Error
            ? cause.message
            : "The templates could not be read.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);
  /** Write the list, and report it. Returns whether storage accepted it. */
  const persist = useCallback(
    async (
      next: readonly ClipTemplate[],
      message: string,
    ): Promise<boolean> => {
      setSaving(true);
      setFailure(undefined);
      setNotice(undefined);
      try {
        await depsRef.current.save(next);
        setTemplates(next);
        setNotice(message);
        return true;
      } catch (cause) {
        setFailure(
          cause instanceof Error
            ? cause.message
            : "The templates could not be saved.",
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [],
  );
  const write = useCallback(
    (next: readonly ClipTemplate[], message: string, id: string) => {
      void (async () => {
        if (await persist(next, message)) open(next, id);
      })();
    },
    [open, persist],
  );
  const select = useCallback(
    (id: string) => open(templates, id),
    [open, templates],
  );
  const create = useCallback(() => {
    const created = freshTemplate(depsRef.current.newTemplateId());
    write(appendTemplate(templates, created), "Template created.", created.id);
  }, [templates, write]);
  const duplicate = useCallback(() => {
    if (draft === undefined) return;
    const duplicated: ClipTemplate = {
      ...copyTemplate(draft),
      id: depsRef.current.newTemplateId(),
      name: `${draft.name} copy`,
    };
    write(
      appendTemplate(templates, duplicated),
      "Template duplicated.",
      duplicated.id,
    );
  }, [draft, templates, write]);
  const remove = useCallback(() => {
    if (selectedId === undefined) return;
    const next = removeTemplate(templates, selectedId);
    write(next, "Template deleted.", next[0]?.id ?? "");
  }, [selectedId, templates, write]);
  const restoreStarters = useCallback(() => {
    const next = defaultTemplates();
    write(next, "Starter templates restored.", next[0]?.id ?? "");
  }, [write]);
  const importTemplates = useCallback(
    (text: string) => {
      const imported = parseTemplateImport(text);
      if (!imported.ok) {
        setFailure(imported.error);
        setNotice(undefined);
        return;
      }
      write(
        imported.templates,
        "Templates imported.",
        imported.templates[0]!.id,
      );
    },
    [write],
  );
  const edit = useCallback(
    (changes: (current: ClipTemplate) => ClipTemplate) => {
      setDraft((current) =>
        current === undefined ? current : changes(current),
      );
      setDirty(true);
      setErrors([]);
    },
    [],
  );
  const patch = useCallback(
    (changes: Partial<ClipTemplate>) =>
      edit((current) => ({ ...current, ...changes })),
    [edit],
  );
  const editProperties = useCallback(
    (
      changes: (
        properties: readonly ClipTemplateProperty[],
      ) => ClipTemplateProperty[],
    ) =>
      edit((current) => ({
        ...current,
        properties: changes(current.properties),
      })),
    [edit],
  );
  const setProperty = useCallback(
    (index: number, changes: Partial<ClipTemplateProperty>) =>
      editProperties((properties) =>
        withPropertyAt(properties, index, changes),
      ),
    [editProperties],
  );
  const addProperty = useCallback(
    () => editProperties(withAddedProperty),
    [editProperties],
  );
  const removeProperty = useCallback(
    (index: number) =>
      editProperties((properties) => withoutPropertyAt(properties, index)),
    [editProperties],
  );
  const discard = useCallback(() => {
    if (selectedId === undefined) return;
    select(selectedId);
  }, [select, selectedId]);
  const save = useCallback(() => {
    if (draft === undefined) return;
    const result = validateClipTemplate(draft);
    if (!result.ok || result.template === undefined) {
      setErrors(result.errors);
      setNotice(undefined);
      return;
    }
    const validated = result.template;
    write(
      replaceTemplate(templates, validated),
      `${validated.name} saved.`,
      validated.id,
    );
  }, [draft, templates, write]);
  return {
    loading,
    templates,
    selectedId,
    draft,
    dirty,
    errors,
    saving,
    notice,
    failure,
    select,
    create,
    duplicate,
    remove,
    restoreStarters,
    importTemplates,
    patch,
    setProperty,
    addProperty,
    removeProperty,
    save,
    discard,
  };
}

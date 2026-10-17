/**
 * The minimal slice of `browser.storage.local` the extension modules need.
 *
 * Declared here rather than next to one of its users so both the template store
 * and the pairing store depend on a seam instead of on each other.
 */
export interface StorageArea {
  get(keys: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

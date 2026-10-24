import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PairingDeps } from "./pairingDeps";
import { DEFAULT_CLIPPER_PORT } from "./pairingStore";
import { usePairingSettings } from "./usePairingSettings";

function deps(overrides: Partial<PairingDeps> = {}): PairingDeps {
  return {
    load: async () => undefined,
    save: vi.fn(async () => {}),
    clear: vi.fn(async () => {}),
    ...overrides,
  };
}

describe("usePairingSettings", () => {
  it("fills the fields from the stored pairing", async () => {
    const { result } = renderHook(() =>
      usePairingSettings(
        deps({ load: async () => ({ port: 51234, token: "abc123" }) }),
      ),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.paired).toBe(true);
    expect(result.current.port).toBe("51234");
    expect(result.current.token).toBe("abc123");
    expect(result.current.error).toBeUndefined();
  });

  it("offers the app's default port when the extension is unpaired", async () => {
    const { result } = renderHook(() => usePairingSettings(deps()));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.paired).toBe(false);
    expect(result.current.port).toBe(String(DEFAULT_CLIPPER_PORT));
    expect(result.current.token).toBe("");
  });

  it("reports a pairing it could not read", async () => {
    const { result } = renderHook(() =>
      usePairingSettings(
        deps({
          load: async () => {
            throw new Error("Storage unavailable.");
          },
        }),
      ),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Storage unavailable.");
  });

  it("stores a trimmed pairing and says so", async () => {
    const save = vi.fn(async () => {});
    const { result } = renderHook(() => usePairingSettings(deps({ save })));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setPort("51234"));
    act(() => result.current.setToken("  abc123  "));
    act(() => result.current.save());

    await waitFor(() => expect(result.current.paired).toBe(true));
    expect(save).toHaveBeenCalledWith({ port: 51234, token: "abc123" });
    expect(result.current.notice).toMatch(/Pairing saved/);
    expect(result.current.portError).toBeUndefined();
    expect(result.current.tokenError).toBeUndefined();
  });

  it("refuses to store a port or token it cannot use", async () => {
    const save = vi.fn(async () => {});
    const { result } = renderHook(() => usePairingSettings(deps({ save })));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setPort("70000"));
    act(() => result.current.setToken("   "));
    act(() => result.current.save());

    expect(result.current.portError).toBeDefined();
    expect(result.current.tokenError).toBeDefined();
    expect(save).not.toHaveBeenCalled();
    expect(result.current.paired).toBe(false);
  });

  it("clears a field error as soon as that field is edited", async () => {
    const { result } = renderHook(() => usePairingSettings(deps()));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setPort("70000"));
    act(() => result.current.save());
    expect(result.current.portError).toBeDefined();

    act(() => result.current.setPort("51234"));
    expect(result.current.portError).toBeUndefined();
  });

  it("reports a pairing it could not store", async () => {
    const { result } = renderHook(() =>
      usePairingSettings(
        deps({
          save: async () => {
            throw new Error("The pairing could not be saved.");
          },
        }),
      ),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setToken("abc123"));
    act(() => result.current.save());

    await waitFor(() =>
      expect(result.current.error).toBe("The pairing could not be saved."),
    );
    expect(result.current.paired).toBe(false);
  });

  it("forgets a pairing and empties the token field", async () => {
    const clear = vi.fn(async () => {});
    const { result } = renderHook(() =>
      usePairingSettings(
        deps({ load: async () => ({ port: 51234, token: "abc123" }), clear }),
      ),
    );
    await waitFor(() => expect(result.current.paired).toBe(true));

    act(() => result.current.clear());

    await waitFor(() => expect(result.current.paired).toBe(false));
    expect(clear).toHaveBeenCalledTimes(1);
    expect(result.current.token).toBe("");
    expect(result.current.notice).toMatch(/Pairing removed/);
  });

  it("surfaces a forgotten pairing that could not be removed", async () => {
    const { result } = renderHook(() =>
      usePairingSettings(
        deps({
          load: async () => ({ port: 51234, token: "abc123" }),
          clear: async () => {
            throw new Error("Storage is read-only.");
          },
        }),
      ),
    );
    await waitFor(() => expect(result.current.paired).toBe(true));

    act(() => result.current.clear());

    await waitFor(() =>
      expect(result.current.error).toBe("Storage is read-only."),
    );
    expect(result.current.paired).toBe(true);
  });
});

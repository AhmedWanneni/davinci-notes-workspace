import "@testing-library/jest-dom/vitest";

// Radix primitives (used through `@app/design-system`) observe element size.
// jsdom has no ResizeObserver, so the component tests would throw without this.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (!("ResizeObserver" in globalThis)) {
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver =
    ResizeObserverStub;
}

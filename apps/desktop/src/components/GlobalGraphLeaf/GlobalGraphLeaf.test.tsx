// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GlobalGraphLeaf } from "./GlobalGraphLeaf";

vi.mock("../GraphView", () => ({
  GraphView: () => <div>Graph canvas</div>,
}));

describe("GlobalGraphLeaf", () => {
  it("renders in the workspace and closes without a dialog", () => {
    const onClose = vi.fn();
    render(
      <GlobalGraphLeaf
        graph={{ nodes: new Map(), edges: [], backlinks: new Map() }}
        onClose={onClose}
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Global graph view")).toBeDefined();
    fireEvent.click(screen.getByLabelText("Close global graph"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

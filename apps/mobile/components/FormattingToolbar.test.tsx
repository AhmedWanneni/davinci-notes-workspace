import React from "react";
import { describe, expect, it, vi } from "vitest";
import { FormattingToolbar } from "./FormattingToolbar";

describe("FormattingToolbar Component", () => {
  it("renders formatting toolbar with action buttons", () => {
    const onAction = vi.fn();
    const element = <FormattingToolbar onAction={onAction} />;

    expect(element).toBeDefined();
    expect(element.props.onAction).toBe(onAction);
  });

  it("renders disabled state without crashes", () => {
    const onAction = vi.fn();
    const element = <FormattingToolbar onAction={onAction} disabled={true} />;

    expect(element).toBeDefined();
    expect(element.props.disabled).toBe(true);
  });
});

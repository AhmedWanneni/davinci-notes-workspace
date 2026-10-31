// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AgentScrollBottomBtn } from "./AgentScrollBottomBtn";

describe("AgentScrollBottomBtn", () => {
  it("does not render when visible is false", () => {
    const { container } = render(
      <AgentScrollBottomBtn onClick={vi.fn()} visible={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders button and handles click when visible is true", () => {
    const onClick = vi.fn();
    render(<AgentScrollBottomBtn onClick={onClick} visible={true} />);

    const btn = screen.getByRole("button", { name: /jump to latest/i });
    expect(btn).toBeTruthy();

    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

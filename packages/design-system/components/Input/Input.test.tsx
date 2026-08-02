import React from "react";
import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Input } from "./Input";

describe("Input", () => {
  it("renders correctly", () => {
    const { getByRole } = render(<Input placeholder="Enter text" />);
    const input = getByRole("textbox");
    expect(input).toBeDefined();
    expect(input.getAttribute("placeholder")).toBe("Enter text");
  });

  it("handles value changes", () => {
    const { getByRole } = render(<Input />);
    const input = getByRole("textbox") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "Hello" } });
    expect(input.value).toBe("Hello");
  });

  it("renders with prefix and suffix", () => {
    const { getByText } = render(
      <Input prefix={<span>Pre</span>} suffix={<span>Post</span>} />,
    );

    expect(getByText("Pre")).toBeDefined();
    expect(getByText("Post")).toBeDefined();
  });

  it("applies error variant classes", () => {
    const { container } = render(<Input variant="error" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("wrapper--error");
  });

  it("can be disabled", () => {
    const { getByRole, container } = render(<Input disabled />);
    const input = getByRole("textbox") as HTMLInputElement;
    const wrapper = container.firstChild as HTMLElement;

    expect(input.disabled).toBe(true);
    expect(wrapper.className).toContain("wrapper--disabled");
  });
});

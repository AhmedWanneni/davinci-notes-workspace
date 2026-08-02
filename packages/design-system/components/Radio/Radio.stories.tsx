import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { RadioGroup, RadioGroupItem } from "./Radio";
import { Typography } from "../Typography";

const meta = {
  title: "Primitives/RadioGroup",
  component: RadioGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultValue: "option-one",
  },
  render: (args) => (
    <RadioGroup {...args}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <RadioGroupItem value="option-one" id="r1" />
        <label htmlFor="r1" style={{ cursor: "pointer" }}>
          <Typography size="sm">Option One</Typography>
        </label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <RadioGroupItem value="option-two" id="r2" />
        <label htmlFor="r2" style={{ cursor: "pointer" }}>
          <Typography size="sm">Option Two</Typography>
        </label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <RadioGroupItem value="option-three" id="r3" />
        <label htmlFor="r3" style={{ cursor: "pointer" }}>
          <Typography size="sm">Option Three</Typography>
        </label>
      </div>
    </RadioGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole("radio");
    await expect(radios[0]).toBeChecked();
    await userEvent.click(radios[1]);
    await expect(radios[1]).toBeChecked();
    await userEvent.keyboard("{ArrowDown}");
    await expect(radios[2]).toBeChecked();
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: "option-one",
    disabled: true,
  },
  render: (args) => (
    <RadioGroup {...args}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <RadioGroupItem value="option-one" id="r1-disabled" />
        <label
          htmlFor="r1-disabled"
          style={{ cursor: "not-allowed", opacity: 0.5 }}
        >
          <Typography size="sm">Option One</Typography>
        </label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <RadioGroupItem value="option-two" id="r2-disabled" />
        <label
          htmlFor="r2-disabled"
          style={{ cursor: "not-allowed", opacity: 0.5 }}
        >
          <Typography size="sm">Option Two</Typography>
        </label>
      </div>
    </RadioGroup>
  ),
};

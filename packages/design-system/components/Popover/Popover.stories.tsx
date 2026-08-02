import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within, waitFor } from "storybook/test";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
} from "./Popover";
import { Button } from "../Button";
import { Typography } from "../Typography";
import { Input } from "../Input";

const meta = {
  title: "Primitives/Popover",
  component: PopoverContent,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PopoverContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <Typography size="sm" weight="semibold" style={{ marginBottom: "8px" }}>
          Dimensions
        </Typography>
        <Typography size="sm" color="muted">
          Set the width and height for the layer.
        </Typography>
      </PopoverContent>
    </Popover>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Open popover" }));
    await waitFor(() => {
      expect(within(document.body).getByText("Dimensions")).toBeInTheDocument();
    });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      expect(
        within(document.body).queryByText("Dimensions"),
      ).not.toBeInTheDocument();
    });
  },
};

export const WithForm: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Update dimensions</Button>
      </PopoverTrigger>
      <PopoverContent
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        <div>
          <Typography
            size="sm"
            as="label"
            htmlFor="width"
            style={{ display: "block", marginBottom: "4px" }}
          >
            Width
          </Typography>
          <Input id="width" defaultValue="100%" />
        </div>
        <div>
          <Typography
            size="sm"
            as="label"
            htmlFor="height"
            style={{ display: "block", marginBottom: "4px" }}
          >
            Height
          </Typography>
          <Input id="height" defaultValue="25px" />
        </div>
        <PopoverClose asChild>
          <Button size="sm">Apply</Button>
        </PopoverClose>
      </PopoverContent>
    </Popover>
  ),
};

export const Positions: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        gap: "24px",
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Popover key={side}>
          <PopoverTrigger asChild>
            <Button variant="ghost">{side}</Button>
          </PopoverTrigger>
          <PopoverContent side={side}>
            <Typography size="sm">Popover on {side}</Typography>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  ),
};

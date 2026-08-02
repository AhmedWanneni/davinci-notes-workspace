import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { Dialog, DialogTrigger, DialogContent } from "./Dialog";
import { Button } from "../Button";
import { Input } from "../Input";
import { Typography } from "../Typography";

const meta = {
  title: "Primitives/Dialog",
  component: DialogContent,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof DialogContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent
        title="Edit Profile"
        description="Make changes to your profile here. Click save when you're done."
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            marginTop: "16px",
          }}
        >
          <div>
            <Typography
              size="sm"
              as="label"
              htmlFor="name"
              style={{ display: "block", marginBottom: "8px" }}
            >
              Name
            </Typography>
            <Input id="name" defaultValue="Pedro Duarte" />
          </div>
          <div>
            <Typography
              size="sm"
              as="label"
              htmlFor="username"
              style={{ display: "block", marginBottom: "8px" }}
            >
              Username
            </Typography>
            <Input id="username" defaultValue="@peduarte" prefix="@" />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
              marginTop: "16px",
            }}
          >
            <DialogTrigger asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogTrigger>
            <Button>Save changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Open Dialog" }));
    await waitFor(() => {
      expect(within(document.body).getByRole("dialog")).toBeInTheDocument();
      expect(
        within(document.body).getByText("Edit Profile"),
      ).toBeInTheDocument();
    });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      expect(
        within(document.body).queryByRole("dialog"),
      ).not.toBeInTheDocument();
    });
  },
};

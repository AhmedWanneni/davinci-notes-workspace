import type { Meta, StoryObj } from "@storybook/react";
import { TableGridPicker } from "./TableGridPicker";

const meta: Meta<typeof TableGridPicker> = {
  title: "Components/EditorArea/TableGridPicker",
  component: TableGridPicker,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof TableGridPicker>;

export const Default: Story = {
  render: () => {
    return (
      <TableGridPicker
        onSelect={(cols, rows) => {
          console.log(`Selected ${cols} x ${rows}`);
        }}
      />
    );
  },
};

export const LargeGrid: Story = {
  render: () => {
    return (
      <TableGridPicker
        maxCols={10}
        maxRows={10}
        onSelect={(cols, rows) => {
          console.log(`Selected ${cols} x ${rows}`);
        }}
      />
    );
  },
};

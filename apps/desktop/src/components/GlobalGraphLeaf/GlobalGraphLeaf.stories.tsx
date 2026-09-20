import type { Meta, StoryObj } from "@storybook/react-vite";

import { GlobalGraphLeaf } from "./GlobalGraphLeaf";

const meta = {
  title: "Components/GlobalGraphLeaf",
  component: GlobalGraphLeaf,
  args: {
    graph: { nodes: new Map(), edges: [], backlinks: new Map() },
    onClose: () => {},
    onNavigate: () => {},
  },
} satisfies Meta<typeof GlobalGraphLeaf>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

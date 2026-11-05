import type { Meta, StoryObj } from "@storybook/react";
import { AgentWidgetBlock } from "./AgentWidgetBlock";

const meta: Meta<typeof AgentWidgetBlock> = {
  title: "AgentView/AgentWidgetBlock",
  component: AgentWidgetBlock,
};

export default meta;
type Story = StoryObj<typeof AgentWidgetBlock>;

export const InteractiveCounter: Story = {
  args: {
    source: `<div style="text-align: center; padding: 20px;">
  <h3 style="margin-top:0">Interactive Counter</h3>
  <div id="count" style="font-size: 32px; font-weight: bold; margin: 10px 0;">0</div>
  <button id="btn" style="padding: 6px 16px; border-radius: 6px; border: 1px solid var(--color-border-subtle); background: var(--color-bg-secondary); color: var(--color-text-normal); cursor: pointer;">Increment</button>
  <script>
    let c = 0;
    document.getElementById('btn').addEventListener('click', () => {
      c++;
      document.getElementById('count').textContent = c;
    });
  </script>
</div>`,
    onSaveAsNote: (src) => console.log("save note", src),
  },
};

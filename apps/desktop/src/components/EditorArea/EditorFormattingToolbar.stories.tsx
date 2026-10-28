import type { Meta, StoryObj } from "@storybook/react";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { EditorFormattingToolbar } from "./EditorFormattingToolbar";

const meta: Meta<typeof EditorFormattingToolbar> = {
  title: "Components/EditorArea/EditorFormattingToolbar",
  component: EditorFormattingToolbar,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof EditorFormattingToolbar>;

export const Default: Story = {
  render: () => {
    return (
      <div
        style={{
          maxWidth: "800px",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        <EditorFormattingToolbar
          view={null}
          onOpenInsertMenu={() => console.log("Open insert menu")}
          onOpenImagePicker={() => console.log("Open image picker")}
        />
      </div>
    );
  },
};

export const WithMockView: Story = {
  render: () => {
    const state = EditorState.create({ doc: "Sample note text in CodeMirror" });
    const view = new EditorView({ state });

    return (
      <div
        style={{
          maxWidth: "800px",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        <EditorFormattingToolbar
          view={view}
          onOpenInsertMenu={() => console.log("Open insert menu")}
          onOpenImagePicker={() => console.log("Open image picker")}
        />
      </div>
    );
  },
};

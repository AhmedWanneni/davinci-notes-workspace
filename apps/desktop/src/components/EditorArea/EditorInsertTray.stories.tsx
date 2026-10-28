import type { Meta, StoryObj } from "@storybook/react";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { EditorInsertTray } from "./EditorInsertTray";

const meta: Meta<typeof EditorInsertTray> = {
  title: "Components/EditorArea/EditorInsertTray",
  component: EditorInsertTray,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof EditorInsertTray>;

export const Default: Story = {
  render: () => {
    return (
      <div
        style={{
          maxWidth: "800px",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        <EditorInsertTray
          view={null}
          onClose={() => console.log("Close insert tray")}
          onOpenImagePicker={() => console.log("Open image picker")}
        />
      </div>
    );
  },
};

export const WithMockView: Story = {
  render: () => {
    const state = EditorState.create({ doc: "# Active Document\n\n" });
    const view = new EditorView({ state });

    return (
      <div
        style={{
          maxWidth: "800px",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        <EditorInsertTray
          view={view}
          onClose={() => console.log("Close insert tray")}
          onOpenImagePicker={() => console.log("Open image picker")}
        />
      </div>
    );
  },
};

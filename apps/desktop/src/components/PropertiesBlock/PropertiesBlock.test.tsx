// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { render, screen, fireEvent } from "@testing-library/react";
import { PropertiesBlock } from "./PropertiesBlock";
import {
  upsertNoteProperty,
  removeNoteProperty,
} from "./frontmatterMutator";

describe("PropertiesBlock", () => {
  it("renders frontmatter keys, tags, and string values correctly", () => {
    const frontmatter = {
      tags: ["recipe", "dessert"],
      created: "2026-08-14",
      author: "Leonardo",
    };

    const html = renderToString(<PropertiesBlock frontmatter={frontmatter} />);

    expect(html).toContain("Properties");
    expect(html).toContain("3");
    expect(html).toContain("tags");
    expect(html).toContain("recipe");
    expect(html).toContain("dessert");
    expect(html).toContain("created");
    expect(html).toContain("2026-08-14");
    expect(html).toContain("author");
    expect(html).toContain("Leonardo");
  });

  it("handles wikilinks in property values", () => {
    const frontmatter = {
      author: "[[Leonardo da Vinci]]",
    };

    const html = renderToString(<PropertiesBlock frontmatter={frontmatter} />);
    expect(html).toContain("Leonardo da Vinci");
    expect(html).toContain("properties-block__link");
  });

  it("returns empty when frontmatter is empty", () => {
    const html = renderToString(<PropertiesBlock frontmatter={{}} />);
    expect(html).toBe("");
  });

  it("filters out cover, banner, icon, and kanban-plugin properties", () => {
    const frontmatter = {
      cover: "https://example.com/cover.jpg",
      cover_y: 50,
      banner: "https://example.com/banner.jpg",
      icon: "📚",
      "kanban-plugin": "board",
    };
    const html = renderToString(<PropertiesBlock frontmatter={frontmatter} />);
    expect(html).toBe("");
  });

  it("opens inline add property inputs when clicking Add property and calls onAddProperty", () => {
    const onAddProperty = vi.fn();
    render(
      <PropertiesBlock
        frontmatter={{ status: "draft" }}
        onAddProperty={onAddProperty}
      />,
    );

    const addBtn = screen.getByRole("button", { name: /add property/i });
    fireEvent.click(addBtn);

    const keyInput = screen.getByLabelText("Property name");
    const valInput = screen.getByLabelText("Property value");

    fireEvent.change(keyInput, { target: { value: "priority" } });
    fireEvent.change(valInput, { target: { value: "high" } });
    fireEvent.keyDown(valInput, { key: "Enter" });

    expect(onAddProperty).toHaveBeenCalledWith("priority", "high");
  });

  it("renders Add property button even when note has no properties if onAddProperty is provided", () => {
    const onAddProperty = vi.fn();
    render(<PropertiesBlock frontmatter={{}} onAddProperty={onAddProperty} />);

    const addBtn = screen.getByRole("button", { name: /add property/i });
    fireEvent.click(addBtn);

    const keyInput = screen.getByLabelText("Property name");
    const valInput = screen.getByLabelText("Property value");
    fireEvent.change(keyInput, { target: { value: "tags" } });
    fireEvent.change(valInput, { target: { value: "work, urgent" } });
    fireEvent.click(screen.getByLabelText("Save property"));

    expect(onAddProperty).toHaveBeenCalledWith("tags", ["work", "urgent"]);
  });

  it("upserts and removes frontmatter properties in markdown", () => {
    const initial = "# My Note\n\nBody text";
    const withStatus = upsertNoteProperty(initial, "status", "active");
    expect(withStatus).toBe("---\nstatus: active\n---\n# My Note\n\nBody text");

    const withTags = upsertNoteProperty(withStatus, "tags", ["ai", "notes"]);
    expect(withTags).toContain("status: active");
    expect(withTags).toContain("tags:");

    const updatedStatus = upsertNoteProperty(withTags, "status", "done");
    expect(updatedStatus).toContain("status: done");
    expect(updatedStatus).not.toContain("status: active");

    const removedTags = removeNoteProperty(updatedStatus, "tags");
    expect(removedTags).not.toContain("tags:");
    expect(removedTags).toContain("status: done");
  });
});

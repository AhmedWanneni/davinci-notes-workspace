import { describe, it, expect } from "vitest";
import { parseDatabase } from "./parseDatabase";
import { serializeDatabase } from "./serializeDatabase";

describe("Part 1: Lossless Round-Trip Verification", () => {
  it("losslessly round-trips a standard database table note", () => {
    const raw = `---
database: table
columns:
  - name: Expenses
    type: text
  - name: Price
    type: number
  - name: Urgency
    type: select
    options:
      - { value: Urgent, color: green }
      - { value: Not urgent, color: orange }
  - name: DONE
    type: checkbox
  - name: month
    type: text
---

| Expenses | Price | Urgency | DONE | month |
|---|---|---|---|---|
| friday meeting | 30 | Urgent | true | December |
| PC fixe | 2500 | Not urgent | false | |
`;
    const model = parseDatabase(raw);
    expect(serializeDatabase(model)).toBe(raw);
  });

  it("losslessly round-trips empty cells", () => {
    const raw = `---
database: table
columns:
  - name: Col1
    type: text
  - name: Col2
    type: text
---

| Col1 | Col2 |
|---|---|
| | |
| value | |
| | value |
`;
    const model = parseDatabase(raw);
    expect(serializeDatabase(model)).toBe(raw);
  });

  it("losslessly round-trips ragged rows", () => {
    const raw = `---
database: table
columns:
  - name: A
    type: text
  - name: B
    type: text
  - name: C
    type: text
---

| A | B | C |
|---|---|---|
| single |
| two | columns |
| one | two | three | extra |
`;
    const model = parseDatabase(raw);
    expect(serializeDatabase(model)).toBe(raw);
  });

  it("losslessly round-trips escaped pipes", () => {
    const raw = `---
database: table
columns:
  - name: Expression
    type: text
  - name: Notes
    type: text
---

| Expression | Notes |
|---|---|
| a \\| b | logical OR operator |
| c \\| d \\| e | multiple escaped pipes |
`;
    const model = parseDatabase(raw);
    expect(serializeDatabase(model)).toBe(raw);
  });

  it("losslessly round-trips accents and emojis", () => {
    const raw = `---
database: table
columns:
  - name: Événement 🚀
    type: text
  - name: Catégorie 🎨
    type: select
---

| Événement 🚀 | Catégorie 🎨 |
|---|---|
| Café & Croissant 🥐 | Matin ☀️ |
| Réunion de clôture 🎉 | Travail 💼 |
`;
    const model = parseDatabase(raw);
    expect(serializeDatabase(model)).toBe(raw);
  });

  it("losslessly round-trips CRLF file line endings", () => {
    const raw = "---\r\ndatabase: table\r\ncolumns:\r\n  - name: Task\r\n    type: text\r\n---\r\n\r\n| Task |\r\n|---|\r\n| Item 1 |\r\n";
    const model = parseDatabase(raw);
    expect(serializeDatabase(model)).toBe(raw);
  });

  it("losslessly round-trips files with no trailing newline", () => {
    const raw = `---
database: table
columns:
  - name: Name
    type: text
---

| Name |
|---|
| Row 1 |`;
    const model = parseDatabase(raw);
    expect(serializeDatabase(model)).toBe(raw);
  });

  it("losslessly round-trips padded and unpadded tables", () => {
    const raw = `---
database: table
columns:
  - name: Short
    type: text
  - name: Very Long Column Name
    type: text
---

| Short | Very Long Column Name |
| :--- | :---: |
| a     | b                     |
| unpadded|val|
`;
    const model = parseDatabase(raw);
    expect(serializeDatabase(model)).toBe(raw);
  });

  it("losslessly round-trips extra frontmatter keys and YAML comments", () => {
    const raw = `---
# Important database header comment
database: table
author: Leonardo
version: 2.1
tags: [finance, budget]
columns:
  # Expenses column
  - name: Expenses
    type: text
---

| Expenses |
|---|
| Coffee |
`;
    const model = parseDatabase(raw);
    expect(serializeDatabase(model)).toBe(raw);
  });

  it("losslessly round-trips text before and after the table", () => {
    const raw = `---
database: table
columns:
  - name: Item
    type: text
---

# Project Budget Overview

Here is an introductory paragraph explaining the database.

| Item |
|---|
| Laptop |

## Notes and Summary
- Follow up with procurement next week.
- Keep receipts for all expenses.
`;
    const model = parseDatabase(raw);
    expect(serializeDatabase(model)).toBe(raw);
  });

  it("losslessly round-trips a note with a second table outside the database", () => {
    const raw = `---
database: table
columns:
  - name: Primary
    type: text
---

| Primary |
|---|
| Main database row |

### Archived Historical Log (Read-only)

| Year | Total |
|---|---|
| 2024 | $1,000 |
| 2025 | $2,500 |
`;
    const model = parseDatabase(raw);
    expect(serializeDatabase(model)).toBe(raw);
  });

  it("losslessly round-trips duplicate column names", () => {
    const raw = `---
database: table
columns:
  - name: Value
    type: text
---

| Value | Value |
|---|---|
| Left | Right |
`;
    const model = parseDatabase(raw);
    expect(serializeDatabase(model)).toBe(raw);
  });
});

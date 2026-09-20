---
title: Typography fixture
tags: [design, editor]
---

# Heading at the top

## Consecutive heading

### Third level

#### Fourth level

##### Fifth level

###### Sixth level

This is a deliberately long paragraph that wraps across a narrow editor viewport, so typography, line wrapping, and the full-width content alignment can be checked without a special reader column.


Another paragraph follows a native blank line.

- A long bullet item that wraps onto another visual line and should keep its continuation aligned with the item text rather than the marker.
  - Nested bullet item with enough text to wrap at a narrow width.
    1. Nested ordered item with a long continuation.
- [ ] A task item
- [x] A completed task item

> A multi-line blockquote should use a continuous left border without a filled background.
> Its second line continues the same quote block.

```ts
const longCodeLine = "This intentionally long source line verifies preserved code-block scrolling and a continuous background.";
console.log(longCodeLine);
```

Inline `code` sits with **bold**, *italic*, ~~strikethrough~~, ==highlight==, [a link](https://example.com), [[A wikilink]], and #a-tag.

---

| Column A | Column B |
| --- | --- |
| Full-width table | Cell padding |

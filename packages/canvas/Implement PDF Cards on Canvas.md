# Implement PDF Cards on Canvas

> **Workspace:** /Users/ahmedwaanneni/Desktop/davinci-notes

---

**User**

Read `/Users/ahmedwaanneni/Desktop/davinci-notes/DECISIONS.md`  (the index) first, then open the ADRs relevant to this 
 phase: 0041 and 0042 (canvas package, data model, translation layer, 
 persistence), 0043 (established card-creation/resize pattern), and 
 `/Users/ahmedwaanneni/Desktop/davinci-notes/PERFORMANCE.md`  in full — this phase's central decision is a dependency 
 weight tradeoff, so PERFORMANCE.md's dependency rule applies directly, not 
 just as a general reminder. Also read `/Users/ahmedwaanneni/Desktop/davinci-notes/AGENTS.md`  and `/Users/ahmedwaanneni/Desktop/davinci-notes/PROGRESS.md` . Confirm 
 in `/Users/ahmedwaanneni/Desktop/davinci-notes/PROGRESS.md`  that Phase 8 (performance checkpoint) is done and clean — 
 if it left known unresolved issues, stop and flag this before proceeding. 
 
 Any new decision made in this session gets its own new numbered ADR under 
 docs/adr/ plus a new row in DECISIONS.md's Canvas table — never edit an 
 existing accepted ADR; write a superseding one if something changes. 
 
 This session builds Phase 9 from canvas-feature-plan.md: PDF cards — 
 embedding PDF files on the canvas, scrollable/paginated within the card. 
 
 STEPS, IN ORDER 
 
 1. PDF RENDERING APPROACH (the real decision in this phase — reason 
    through it carefully, this is not a default-to-the-obvious-choice step) 
    - PDF.js is the standard choice for in-browser/webview PDF rendering, 
      but it is NOT small — check its actual bundle size (bundlephobia or 
      equivalent) before committing, and confirm it can be loaded lazily 
      specifically for PDF cards (not bundled into packages/canvas's base 
      load, which would mean every canvas pays PDF.js's cost even with zero 
      PDF cards on it) — this needs its own lazy-load boundary, nested 
      inside the canvas package's existing lazy-load boundary from Phase 0 
    - Check whether the existing pdf skill/tooling already used elsewhere 
      in this project (if any PDF handling exists already, e.g. for 
      document export or reading) can be reused here instead of adding a 
      second PDF-handling dependency — don't introduce a duplicate PDF 
      library if one is already in the project for a different purpose 
    - State the actual bundle cost, the lazy-load boundary design, and 
      confirm this was checked before implementing — don't proceed past 
      this step without those numbers 
 
 2. PDF NODE DATA MODEL 
    - Same "file" node variant as image/video/markdown embeds (per the 
      JSON Canvas spec, per Phase 6/7's precedent) — path reference, not 
      embedded binary. Confirm this, don't create a new node type 
      unnecessarily. 
 
 3. RENDERING 
    - Render the PDF within the card bounds, scrollable/paginated 
      (decide which — continuous scroll vs. page-by-page navigation 
      controls; continuous scroll is likely the better fit for a small 
      card context, state which was chosen and why) 
    - Respect card resize — the PDF viewer should reflow/rescale sensibly 
      when the card is resized, not just clip 
    - Lazy-load per Phase 8's viewport-culling principle: a PDF card that's 
      off-screen should not be rendering/decoding pages, same discipline 
      already established for media cards in Phase 7 
 
 4. CREATE A PDF CARD 
    - Drag a PDF file from the file tree onto the canvas — reuse the exact 
      same drag-and-drop mechanism from Phase 6/7, extended to recognize 
      .pdf files, don't build a third variant of this creation flow 
 
 VERIFICATION 
    - Embed a real PDF (multi-page, reasonably sized — a genuine test 
      document, not a 1-page trivial file) as a card, confirm it renders 
      and scrolls/paginates correctly 
    - Resize the card, confirm the PDF view reflows sensibly 
    - Confirm the lazy-load boundary actually works: check the initial 
      canvas bundle (per Phase 0's bundle-analysis approach) does NOT 
      include PDF.js when no PDF card exists on the canvas, and confirm it 
      loads only when a PDF card is actually present/visible 
    - Re-check pan/zoom smoothness on a canvas with several PDF cards 
      alongside other card types (text/file-embed/image) — this is a good 
      canary for whether Phase 8's culling fixes hold up against a new, 
      heavier card type, not just the mix that was tested in Phase 8 
    - Save and reload the canvas, confirm PDF cards restore correctly 
 
 Do NOT build webpage cards or nested canvas cards in this session — those 
 are Phases 10 and 11. 
 
 WRAP UP 
    - Update `/Users/ahmedwaanneni/Desktop/davinci-notes/PROGRESS.md`  PDF cards working, the rendering approach chosen 
      and actual bundle cost, confirmation the lazy-load boundary was 
      verified (not assumed) 
    - Write a new ADR for the PDF rendering dependency choice and lazy-load 
      boundary design — add as a new row in `/Users/ahmedwaanneni/Desktop/davinci-notes/DECISIONS.md`  Canvas table

**Assistant**

I'll start by reading all the required files to understand the project context, current state, and relevant decisions before proceeding with Phase 9 implementation.

Now let me read the relevant ADRs and check for existing PDF dependencies in the project.

Phase 8 is confirmed complete with no unresolved blockers. The deferred items are just watch-points for future scaling, not issues to fix before proceeding. Let me now read the relevant ADRs and check for existing PDF tooling.

Phase 8 confirmed complete and clean. No existing PDF dependencies found. Now let me explore the canvas package structure to understand the existing patterns for media/file cards, and research PDF.js bundle size.

I have sufficient research data. Let me check the monorepo structure and install the dependency, then create the ADR and implement.

Now let me install pdfjs-dist and proceed with the implementation.

Now I'll implement the changes. Starting with the data model updates and PDF extension support.

I see two issues: 1) pdfjs-dist wasn't actually installed properly (the pnpm add command exited with 0 but didn't install), and 2) the barrel `index.ts` statically exports `PdfCardView` which breaks the lazy-load boundary. Let me fix both.

I see — the initial `pnpm add` didn't actually modify package.json (pdfjs-dist is missing from dependencies). Let me fix that properly.

Let me try installing directly with non-interactive flags and create a vitest mock to handle test-time imports.

All 124 tests pass. Now let me run lint and typecheck, and also write a PdfCardView test.

Let me refactor `PdfCardView.tsx` to fix the lint issue and handle the cleanup effect properly. The current file also needs splitting due to length concerns.

The file is 326 lines, exceeding the 250 hard cap. Let me extract the loader and resize logic into separate hooks.

Now let me run full validation across the canvas package and add a PdfCardView test.

---


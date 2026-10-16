import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { borderWidthTokens } from "../dist/borders.js";
import { borderRadiusTokens } from "../dist/radii.js";
import { colorTokens } from "../dist/colors.js";
import { spacingTokens } from "../dist/spacing.js";
import { typographyTokens } from "../dist/typography.js";
import { zIndexTokens } from "../dist/zIndex.js";
import { motionTokens } from "../dist/motion.js";
import { iconTokens } from "../dist/icons.js";
import { editorTokens } from "../dist/editor.js";
import { mobileTokens } from "../dist/mobile.js";
import { fullMobileTokens } from "../dist/mobileTheme.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 1. Generate desktop variables list in exact canonical order
function getDesktopVariables() {
  const vars = [];
  // border width & radius
  for (const [k, v] of Object.entries(borderWidthTokens)) vars.push([`border-width-${k}`, v]);
  for (const [k, v] of Object.entries(borderRadiusTokens)) vars.push([`border-radius-${k}`, v]);
  // color bg
  for (const [k, v] of Object.entries(colorTokens.bg)) vars.push([`color-bg-${k}`, v]);
  // color text
  for (const [k, v] of Object.entries(colorTokens.text)) vars.push([`color-text-${k}`, v]);
  // color border
  for (const [k, v] of Object.entries(colorTokens.border)) vars.push([`color-border-${k}`, v]);
  // color interactive
  for (const [k, v] of Object.entries(colorTokens.interactive)) vars.push([`color-interactive-${k}`, v]);
  // color shadow
  vars.push(["color-shadow", colorTokens.shadow]);

  // editor
  vars.push(["editor-line-height", editorTokens.lineHeight]);
  vars.push(["editor-content-padding-x", editorTokens.contentPaddingX]);
  vars.push(["editor-content-padding-y", editorTokens.contentPaddingY]);
  vars.push(["editor-content-padding-bottom", editorTokens.contentPaddingBottom]);
  for (const lvl of ["h1", "h2", "h3", "h4", "h5", "h6"]) {
    const h = editorTokens.heading[lvl];
    vars.push([`editor-heading-${lvl}-size`, h.size]);
    vars.push([`editor-heading-${lvl}-weight`, h.weight]);
    vars.push([`editor-heading-${lvl}-line-height`, h.lineHeight]);
    vars.push([`editor-heading-${lvl}-space-above`, h.spaceAbove]);
    vars.push([`editor-heading-${lvl}-space-below`, h.spaceBelow]);
  }
  vars.push(["editor-code-padding-x", editorTokens.code.paddingX]);
  vars.push(["editor-code-radius", editorTokens.code.radius]);
  vars.push(["editor-code-block-padding-y", editorTokens.code.blockPaddingY]);
  vars.push(["editor-list-indent", editorTokens.listIndent]);
  vars.push(["editor-obsidian-body-font-size", editorTokens.obsidian.bodyFontSize]);
  vars.push(["editor-obsidian-body-line-height", editorTokens.obsidian.bodyLineHeight]);
  vars.push(["editor-obsidian-content-max-width", editorTokens.obsidian.contentMaxWidth]);
  vars.push(["editor-obsidian-content-line-padding-inline", editorTokens.obsidian.contentLinePaddingInline]);
  for (const lvl of ["h1", "h2", "h3", "h4", "h5", "h6"]) {
    const h = editorTokens.obsidian.heading[lvl];
    vars.push([`editor-obsidian-heading-${lvl}-size`, h.size]);
    vars.push([`editor-obsidian-heading-${lvl}-weight`, h.weight]);
    vars.push([`editor-obsidian-heading-${lvl}-line-height`, h.lineHeight]);
  }
  vars.push(["editor-obsidian-spacing-paragraph-live-preview", editorTokens.obsidian.spacing.paragraphLivePreview]);
  vars.push(["editor-obsidian-spacing-paragraph-source-mode", editorTokens.obsidian.spacing.paragraphSourceMode]);
  vars.push(["editor-obsidian-spacing-list", editorTokens.obsidian.spacing.list]);
  vars.push(["editor-obsidian-color-markdown-marker", editorTokens.obsidian.color.markdownMarker]);
  vars.push(["editor-obsidian-color-link", editorTokens.obsidian.color.link]);
  vars.push(["editor-obsidian-color-tag", editorTokens.obsidian.color.tag]);
  vars.push(["editor-obsidian-color-tag-background", editorTokens.obsidian.color.tagBackground]);
  vars.push(["editor-obsidian-color-tag-background-mobile", editorTokens.obsidian.color.tagBackgroundMobile]);

  // icon
  for (const [k, v] of Object.entries(iconTokens.size)) vars.push([`icon-size-${k}`, v]);
  for (const [k, v] of Object.entries(iconTokens.weight)) vars.push([`icon-weight-${k}`, v]);

  // motion
  for (const [k, v] of Object.entries(motionTokens.duration)) vars.push([`motion-duration-${k}`, v]);
  for (const [k, v] of Object.entries(motionTokens.ease)) vars.push([`motion-ease-${k}`, v]);

  // space
  for (const [k, v] of Object.entries(spacingTokens)) vars.push([`space-${k}`, v]);

  // font & type
  vars.push(["font-ui", typographyTokens.font.ui]);
  vars.push(["font-editor", typographyTokens.font.editor]);
  for (const [k, v] of Object.entries(typographyTokens.scale)) vars.push([`type-scale-${k}`, v]);
  for (const [k, v] of Object.entries(typographyTokens.weight)) vars.push([`type-weight-${k}`, v]);
  for (const [k, v] of Object.entries(typographyTokens.leading)) vars.push([`type-leading-${k}`, v]);

  return vars;
}

function generateDesktopStyles(vars) {
  ensureDir(path.join(distDir, "css"));
  ensureDir(path.join(distDir, "scss"));

  const cssContent = `/**\n * Do not edit directly, this file was auto-generated.\n */\n\n:root {\n${vars.map(([k, v]) => `  --${k}: ${v};`).join("\n")}\n}\n`;
  fs.writeFileSync(path.join(distDir, "css/variables.css"), cssContent, "utf8");

  const scssContent = `\n// Do not edit directly, this file was auto-generated.\n\n${vars.map(([k, v]) => `$${k}: ${v};`).join("\n")}\n`;
  fs.writeFileSync(path.join(distDir, "scss/_variables.scss"), scssContent, "utf8");

  const dsTokensDist = path.resolve(__dirname, "../../design-system/tokens/dist");
  if (fs.existsSync(dsTokensDist)) {
    fs.writeFileSync(path.join(dsTokensDist, "variables.css"), cssContent, "utf8");
    fs.writeFileSync(path.join(dsTokensDist, "_variables.scss"), scssContent, "utf8");
  }
}

function generateWebview(vars) {
  ensureDir(path.join(distDir, "webview"));
  const cssString = `:root {\n${vars.map(([k, v]) => `  --${k}: ${v};`).join("\n")}\n}`;
  fs.writeFileSync(path.join(distDir, "webview/editorVariables.css"), cssString, "utf8");
  fs.writeFileSync(path.join(distDir, "webview/index.js"), `export const editorVariablesCss = ${JSON.stringify(cssString)};\nexport default editorVariablesCss;\n`, "utf8");
  fs.writeFileSync(path.join(distDir, "webview/index.d.ts"), `export declare const editorVariablesCss: string;\nexport default editorVariablesCss;\n`, "utf8");
}

function generateMobile() {
  ensureDir(path.join(distDir, "mobile"));
  const content = `export const mobileTokens = ${JSON.stringify(mobileTokens, null, 2)};\nexport const fullMobileTokens = ${JSON.stringify(fullMobileTokens, null, 2)};\nexport default fullMobileTokens;\n`;
  fs.writeFileSync(path.join(distDir, "mobile/index.js"), content, "utf8");
  const dts = `import type { MobileTokensNamespace } from "../mobile";\nimport type { MobileTokens } from "../mobileTheme";\nexport declare const mobileTokens: MobileTokensNamespace;\nexport declare const fullMobileTokens: MobileTokens;\nexport default fullMobileTokens;\n`;
  fs.writeFileSync(path.join(distDir, "mobile/index.d.ts"), dts, "utf8");
}

function generateTailwindPreset() {
  ensureDir(path.join(distDir, "tailwind"));
  const presetConfig = {
    theme: {
      extend: {
        colors: {
          bg: colorTokens.bg,
          text: colorTokens.text,
          border: colorTokens.border,
          interactive: colorTokens.interactive,
          shadow: colorTokens.shadow,
          press: mobileTokens.pressState,
        },
        spacing: {
          ...spacingTokens,
          "touch-target": mobileTokens.touchTargetSize,
        },
        borderRadius: {
          ...borderRadiusTokens,
          "bottom-sheet": mobileTokens.bottomSheetRadius,
        },
        borderWidth: borderWidthTokens,
        fontSize: {
          xs: ["0.75rem", { lineHeight: "1.2" }],
          sm: ["0.875rem", { lineHeight: "1.5" }],
          base: ["1rem", { lineHeight: "1.5" }],
          lg: ["1.25rem", { lineHeight: "1.5" }],
          xl: ["1.5rem", { lineHeight: "1.75" }],
          "2xl": ["2rem", { lineHeight: "1.75" }],
          "mobile-body": [mobileTokens.bodySize, { lineHeight: mobileTokens.bodyLineHeight }],
        },
        fontWeight: typographyTokens.weight,
        zIndex: zIndexTokens,
        transitionDuration: motionTokens.duration,
        transitionTimingFunction: motionTokens.ease,
      },
    },
  };

  const esm = `export const designTokensPreset = ${JSON.stringify(presetConfig, null, 2)};\nexport default designTokensPreset;\n`;
  fs.writeFileSync(path.join(distDir, "tailwind/preset.js"), esm, "utf8");

  const cjs = `module.exports = ${JSON.stringify(presetConfig, null, 2)};\n`;
  fs.writeFileSync(path.join(distDir, "tailwind/preset.cjs"), cjs, "utf8");

  const dts = `export declare const designTokensPreset: Record<string, unknown>;\nexport default designTokensPreset;\n`;
  fs.writeFileSync(path.join(distDir, "tailwind/preset.d.ts"), dts, "utf8");
}

const vars = getDesktopVariables();
generateDesktopStyles(vars);
generateWebview(vars);
generateMobile();
generateTailwindPreset();
console.log(`Generated design-tokens successfully (${vars.length} desktop variables)`);

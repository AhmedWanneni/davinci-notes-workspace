import type { PluginDom } from "@app/plugin-api";

export const pluginDom: PluginDom = {
  createEl(tag, options = {}) {
    const element = document.createElement(tag);
    if (options.text !== undefined) element.textContent = options.text;
    if (options.cls) element.className = options.cls;
    for (const [name, value] of Object.entries(options.attr ?? {})) {
      element.setAttribute(name, value);
    }
    return element;
  },
  createText(text) {
    return document.createTextNode(text);
  },
};

import { encodePayload } from "../src/base64Payload";

export function buildEditorInjectedScript(
  content: string,
  activePath: string,
  themeCss: string,
  hasMetricsHandler: boolean = false,
): string {
  const encContent = JSON.stringify(encodePayload(content));
  const encPath = JSON.stringify(activePath);
  const encCss = JSON.stringify(themeCss ?? "");
  const names = hasMetricsHandler
    ? "['onDocChanged', 'onFlushAck', 'onMetricsUpdate']"
    : "['onDocChanged', 'onFlushAck']";

  return `
    window.ReactNativeWebView = window.ReactNativeWebView || {};
    if (typeof window.ReactNativeWebView.injectedObjectJson !== 'function') {
      window.ReactNativeWebView.injectedObjectJson = function() {
        return JSON.stringify({
          EXPO_DOM_HOST_OS: 'android',
          initialProps: {
            names: ${names},
            props: { initialContent: ${encContent}, notePath: ${encPath}, themeCss: ${encCss} }
          }
        });
      };
    }
    window.$$EXPO_DOM_HOST_OS = window.$$EXPO_DOM_HOST_OS || 'android';
    window.$$EXPO_INITIAL_PROPS = window.$$EXPO_INITIAL_PROPS || {
      names: ${names},
      props: { initialContent: ${encContent}, notePath: ${encPath}, themeCss: ${encCss} }
    };
    true;
  `;
}

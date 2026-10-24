export function NavigationBar(): null {
  return null;
}

NavigationBar.setStyle = () => {};
NavigationBar.setHidden = () => {};

export const setStyle = NavigationBar.setStyle;
export const setHidden = NavigationBar.setHidden;

export async function setVisibilityAsync(_visibility: string): Promise<void> {}
export async function getVisibilityAsync(): Promise<string> {
  return "visible";
}
export function useVisibility(): string {
  return "visible";
}
export function addVisibilityListener(): { remove: () => void } {
  return { remove: () => {} };
}

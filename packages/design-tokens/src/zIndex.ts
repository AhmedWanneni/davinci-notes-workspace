export interface ZIndexTokens {
  readonly base: string;
  readonly elevated: string;
  readonly sticky: string;
  readonly dropdown: string;
  readonly popover: string;
  readonly dialog: string;
  readonly modal: string;
  readonly overlay: string;
  readonly toast: string;
  readonly max: string;
}

export const zIndexTokens: ZIndexTokens = {
  base: "0",
  elevated: "10",
  sticky: "20",
  dropdown: "50",
  popover: "50",
  dialog: "100",
  modal: "100",
  overlay: "101",
  toast: "1000",
  max: "9999",
} as const;

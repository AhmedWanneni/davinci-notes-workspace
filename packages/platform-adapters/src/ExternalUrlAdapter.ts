export interface ExternalUrlAdapter {
  openUrl(url: string): Promise<void>;
}

export interface AIStatusIndicatorProps { providerName: string; transmitting: boolean; }

export function AIStatusIndicator({ providerName, transmitting }: AIStatusIndicatorProps) {
  return <span className="status-bar__ai-indicator" aria-label={transmitting ? `${providerName} transmitting` : `${providerName} ready`}>{transmitting ? `${providerName} transmitting` : `${providerName} ready`}</span>;
}

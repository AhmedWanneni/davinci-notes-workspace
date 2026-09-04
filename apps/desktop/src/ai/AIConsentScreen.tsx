import { Button, Typography } from "@app/design-system";

export interface AIConsentScreenProps {
  providerName: string;
  processingNotice?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function AIConsentScreen({ providerName, processingNotice, onConfirm, onCancel }: AIConsentScreenProps) {
  return (
    <section role="dialog" aria-labelledby="ai-consent-title" className="ai-consent">
      <Typography variant="h3" size="sm" id="ai-consent-title">Enable cloud AI?</Typography>
      <Typography variant="text" size="xs" color="muted">
        DaVinci Notes AI sends note text from the AI features you enable to {providerName} for processing.
        {processingNotice ? ` ${processingNotice}` : ""}
        Semantic search and link suggestions may send text from multiple notes to create embeddings.
        Ask your vault sends selected note excerpts and your question to the provider.
      </Typography>
      <Typography variant="text" size="xs" color="muted">
        Your API key is stored in your operating system&apos;s secure credential store. DaVinci Notes does
        not receive or store your provider key. Ollama is available separately as a local-server option;
        this cloud consent does not apply to it. You can turn this off and remove the stored key at any time.
      </Typography>
      <div>
        <Button variant="primary" onClick={() => void onConfirm()}>Enable cloud AI</Button>
        <Button variant="secondary" onClick={onCancel}>Not now</Button>
      </div>
    </section>
  );
}

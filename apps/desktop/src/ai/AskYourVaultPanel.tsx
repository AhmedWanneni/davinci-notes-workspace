import { useState } from "react";
import { Button, Typography } from "@app/design-system";
import type { AskYourVaultResult } from "@app/ai-qa";
import "./AskYourVaultPanel.scss";

export interface AskYourVaultPanelProps {
  onAsk: (question: string) => Promise<AskYourVaultResult>;
  onOpenCitation?: (notePath: string, startLine: number) => void;
  cloudActive: boolean;
}

export function AskYourVaultPanel({ onAsk, onOpenCitation, cloudActive }: AskYourVaultPanelProps) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskYourVaultResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true); setError(null);
    window.dispatchEvent(new Event("davinci-ai-transmission-start"));
    try { setResult(await onAsk(question)); } catch (reason) {
      setResult(null); setError(reason instanceof Error ? reason.message : "The question could not be answered.");
    } finally { setBusy(false); window.dispatchEvent(new Event("davinci-ai-transmission-end")); }
  };
  return (
    <section className="ask-your-vault" aria-labelledby="ask-your-vault-title">
      <header className="ask-your-vault__header"><Typography variant="h3" size="sm" id="ask-your-vault-title">Ask your vault</Typography>{cloudActive && <span className="ask-your-vault__cloud-status">Cloud AI active</span>}</header>
      <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about your notes" aria-label="Question" />
      <Button onClick={() => void submit()} disabled={!question.trim() || busy}>{busy ? "Asking..." : "Ask"}</Button>
      {error && <p role="alert">{error}</p>}
      {result && <div className="ask-your-vault__answer"><Typography variant="text" size="sm">{result.answer}</Typography><h4>Sources</h4><ul>{result.citations.map((citation) => <li key={citation.chunkId}><button type="button" onClick={() => {
        if (onOpenCitation) {
          onOpenCitation(citation.notePath, citation.startLine);
        } else {
          window.dispatchEvent(new CustomEvent("davinci-ai-open-citation", { detail: { notePath: citation.notePath, startLine: citation.startLine } }));
        }
      }}>{citation.notePath}{citation.heading ? ` - ${citation.heading}` : ""} (line {citation.startLine})</button></li>)}</ul></div>}
    </section>
  );
}

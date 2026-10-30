import { useState } from "react";
import { Button, Input, Typography } from "@app/design-system";

export interface AIKeyEntryScreenProps {
  providerName: string;
  onValidateAndSave: (apiKey: string) => Promise<void>;
  onCancel: () => void;
}

export function AIKeyEntryScreen({ providerName, onValidateAndSave, onCancel }: AIKeyEntryScreenProps) {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true); setError(null);
    try { await onValidateAndSave(apiKey.trim()); } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The provider key could not be validated.");
    } finally { setSaving(false); }
  };
  return (
    <section role="dialog" aria-labelledby="ai-key-title" className="ai-consent">
      <Typography variant="h3" size="sm" id="ai-key-title">Connect {providerName}</Typography>
      <p>Enter your provider API key. Sophia validates it with a small request and stores it only in your operating system secure credential store.</p>
      <Input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} aria-label="Provider API key" autoComplete="off" />
      {error && <p role="alert">{error}</p>}
      <div><Button onClick={() => void submit()} disabled={!apiKey.trim() || saving}>{saving ? "Validating..." : "Validate and save"}</Button><Button variant="secondary" onClick={onCancel}>Cancel</Button></div>
    </section>
  );
}

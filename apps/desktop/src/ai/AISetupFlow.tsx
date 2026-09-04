import { useState } from "react";
import { AIConsentScreen } from "./AIConsentScreen";
import { AIKeyEntryScreen } from "./AIKeyEntryScreen";
import { saveAIConsent } from "./aiConsentState";
import { validateAndSaveProviderKey, type AIProviderId } from "./AISubsystem";

export interface AISetupFlowProps {
  providerName: string;
  providerId?: Exclude<AIProviderId, "ollama">;
  onComplete: () => void;
  onCancel: () => void;
}

/** Consent is completed before key entry, but cloud state is committed only after validation succeeds. */
export function AISetupFlow({ providerName, providerId = "openai-compatible", onComplete, onCancel }: AISetupFlowProps) {
  const [consented, setConsented] = useState(false);
  const processingNotice = providerId === "openrouter"
    ? "OpenRouter forwards requests to the underlying model provider selected in its routing catalog."
    : undefined;
  if (!consented) return <AIConsentScreen providerName={providerName} processingNotice={processingNotice} onConfirm={() => setConsented(true)} onCancel={onCancel} />;
  return (
    <AIKeyEntryScreen
      providerName={providerName}
      onValidateAndSave={async (apiKey) => {
        await validateAndSaveProviderKey(providerId, apiKey);
        await saveAIConsent("cloud", true);
        onComplete();
      }}
      onCancel={onCancel}
    />
  );
}

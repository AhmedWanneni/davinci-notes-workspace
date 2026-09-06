import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Button, Checkbox, Input, Typography } from "@app/design-system";
import { loadAISubsystem } from "../../ai/loadAISubsystem";
import type { AIProviderId } from "../../ai/AISubsystem";
import { providerValidationFailureMessage, type ProviderValidationFailure } from "../../ai/providerValidationFailure";

type Feature = "semantic-search" | "suggest-links" | "ask-vault";
interface AIState { provider: AIProviderId; status: "unknown" | "ready" | "failed"; failure: ProviderValidationFailure | null; features: Record<Feature, boolean>; }
const initialState: AIState = { provider: "openai-compatible", status: "unknown", failure: null, features: { "semantic-search": false, "suggest-links": false, "ask-vault": false } };
const providerNames: Record<AIProviderId, string> = { "openai-compatible": "OpenAI-compatible cloud", gemini: "Google Gemini", openrouter: "OpenRouter", ollama: "Ollama (local server)" };
const defaultModels = { embeddingModel: "openai/text-embedding-3-small", chatModel: "openai/gpt-4o-mini" };
const notifyAIStateChanged = () => window.dispatchEvent(new Event("davinci-ai-state-changed"));

export function AISettingsPanel() {
  const [state, setState] = useState(initialState);
  const [setup, setSetup] = useState<ReactNode>(null);
  const [loading, setLoading] = useState(true);
  const [ollama, setOllama] = useState({ baseUrl: "http://localhost:11434", embeddingModel: "embeddinggemma", chatModel: "gemma3" });
  const [openrouter, setOpenrouter] = useState(defaultModels);
  const reload = async () => {
    const ai = await loadAISubsystem();
    const provider = await ai.loadSelectedProvider();
    const models = await ai.loadProviderModels("openrouter");
    setOpenrouter(models);
    const ollamaModels = await ai.loadProviderModels("ollama");
    const ollamaBaseUrl = await ai.loadOllamaBaseUrl();
    setOllama({ baseUrl: ollamaBaseUrl, ...ollamaModels });
    const features = { ...initialState.features };
    for (const feature of Object.keys(features) as Feature[]) features[feature] = await ai.loadAIConsent(feature);
    setState({ provider, status: await ai.loadAIProviderStatus(provider), failure: await ai.loadAIProviderFailure(provider), features });
    setLoading(false);
  };
  useEffect(() => { void reload(); }, []);
  const selectProvider = async (provider: AIProviderId) => { const ai = await loadAISubsystem(); await ai.saveSelectedProvider(provider); setState((current) => ({ ...current, provider, status: "unknown", failure: null })); notifyAIStateChanged(); };
  const toggleFeature = async (feature: Feature, enabled: boolean) => { const ai = await loadAISubsystem(); await ai.saveAIConsent(feature, enabled); setState((current) => ({ ...current, features: { ...current.features, [feature]: enabled } })); notifyAIStateChanged(); };
  const connect = async () => { const ai = await loadAISubsystem(); if (state.provider === "openrouter") await ai.saveProviderModels("openrouter", openrouter.embeddingModel, openrouter.chatModel); const providerId = state.provider === "ollama" ? undefined : state.provider; setSetup(<ai.AISetupFlow providerId={providerId} providerName={providerNames[state.provider]} onComplete={() => { notifyAIStateChanged(); setSetup(null); void reload(); }} onCancel={() => setSetup(null)} />); };
  const saveOllama = async () => { const ai = await loadAISubsystem(); await ai.saveOllamaConfig(ollama.baseUrl, ollama.embeddingModel, ollama.chatModel); await ai.saveSelectedProvider("ollama"); const provider = await ai.createConfiguredProvider("ollama"); try { await provider.embed({ inputs: ["DaVinci Notes connection test"] }); await ai.saveAIProviderStatus("ready", "ollama"); notifyAIStateChanged(); await reload(); } catch { await ai.saveAIProviderStatus("failed", "ollama"); notifyAIStateChanged(); setState((current) => ({ ...current, status: "failed" })); } finally { await provider.dispose(); } };
  if (loading) return <section className="settings-dialog__section"><Typography variant="text" size="xs" color="muted">Loading AI settings...</Typography></section>;
  if (setup) return <section className="settings-dialog__section">{setup}</section>;
  return <section className="settings-dialog__section" aria-labelledby="ai-settings-title">
    <Typography variant="h3" size="sm" id="ai-settings-title">AI provider</Typography>
    <Typography variant="text" size="xs" color="muted">Choose where enabled AI features run. Cloud providers send enabled note data to the named provider; Ollama uses a server you manage on your device.</Typography>
    <select value={state.provider} onChange={(event) => void selectProvider(event.target.value as AIProviderId)} aria-label="AI provider">
      {(Object.keys(providerNames) as AIProviderId[]).map((provider) => <option key={provider} value={provider}>{providerNames[provider]}</option>)}
    </select>
    {state.provider === "ollama" ? <>
      <Input value={ollama.baseUrl} onChange={(event) => setOllama({ ...ollama, baseUrl: event.target.value })} aria-label="Ollama server address" />
      <Input value={ollama.embeddingModel} onChange={(event) => setOllama({ ...ollama, embeddingModel: event.target.value })} aria-label="Ollama embedding model" />
      <Input value={ollama.chatModel} onChange={(event) => setOllama({ ...ollama, chatModel: event.target.value })} aria-label="Ollama chat model" />
      {!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(ollama.baseUrl.trim()) && <Typography variant="text" size="xs" color="error">This is a remote Ollama server; enabled note data may leave this device. Use localhost for local-only processing.</Typography>}
      <Button onClick={() => void saveOllama()}>Test and save Ollama</Button>
      {state.status === "failed" && <Typography variant="text" size="xs" color="error">Ollama is unavailable or the configured model is missing. Start Ollama and check the address and model names.</Typography>}
    </> : <>
      {state.provider === "openrouter" && <>
        <Input value={openrouter.embeddingModel} onChange={(event) => setOpenrouter({ ...openrouter, embeddingModel: event.target.value })} aria-label="OpenRouter embedding model" />
        <Input value={openrouter.chatModel} onChange={(event) => setOpenrouter({ ...openrouter, chatModel: event.target.value })} aria-label="OpenRouter chat model" />
      </>}
      <Button onClick={() => void connect()}>{state.status === "ready" ? `Reconnect ${providerNames[state.provider]}` : `Connect ${providerNames[state.provider]}`}</Button>
    </>}
    {state.status === "failed" && state.provider !== "ollama" && <Typography variant="text" size="xs" color="error">{providerValidationFailureMessage(providerNames[state.provider], state.failure)}</Typography>}
    {(state.provider === "ollama" || state.status === "ready") && (Object.keys(state.features) as Feature[]).map((feature) => <label key={feature} className="settings-dialog__row"><Typography variant="text" size="xs">{feature === "ask-vault" ? "Ask your vault" : feature === "suggest-links" ? "Suggested links" : "Semantic search"}</Typography><Checkbox checked={state.features[feature]} onCheckedChange={(checked) => void toggleFeature(feature, checked === true)} aria-label={feature} /></label>)}
  </section>;
}

import type { AIProviderId } from "../../ai/AISubsystem";

export const PROVIDER_POPULAR_MODELS: Record<AIProviderId, string[]> = {
  gemini: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
  ollama: ["gemma3", "llama3", "mistral", "qwen2.5-coder"],
  openrouter: [
    "openai/gpt-4o-mini",
    "anthropic/claude-3.5-haiku",
    "anthropic/claude-3.5-sonnet",
  ],
  "openai-compatible": ["gpt-4o-mini", "gpt-4o"],
};

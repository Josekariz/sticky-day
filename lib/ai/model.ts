import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";

export type Provider = "google" | "groq";

export type ModelConfig = { provider: Provider; apiKey: string; modelId: string };

/** The only place that knows what a provider is. */
export function getModel(cfg: ModelConfig): LanguageModel {
  switch (cfg.provider) {
    case "google": return createGoogleGenerativeAI({ apiKey: cfg.apiKey })(cfg.modelId);
    case "groq":   return createGroq({ apiKey: cfg.apiKey })(cfg.modelId);
  }
}

type ChainEntry = { model: LanguageModel; modelId: string };

/** Every configured provider:model pair, in AI_ORDER. */
export function getModelChain(): ChainEntry[] {
  return (process.env.AI_ORDER ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const colon = entry.indexOf(":");
      if (colon < 1) return [];
      const provider = entry.slice(0, colon).trim() as Provider;
      const modelId = entry.slice(colon + 1).trim();
      const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];
      return apiKey && modelId ? [{ model: getModel({ provider, apiKey, modelId }), modelId }] : [];
    });
}

/** Try each model in turn; the first that succeeds wins. */
export async function withFallback<T>(
  fn: (model: LanguageModel, modelId: string) => Promise<T>,
): Promise<T> {
  const chain = getModelChain();
  if (chain.length === 0) throw new Error("No AI provider configured");
  let last: unknown;
  for (const { model, modelId } of chain) {
    try {
      return await fn(model, modelId);
    } catch (e) {
      last = e;
      console.warn(`model ${modelId} failed, trying next:`, (e as Error).message);
    }
  }
  throw last;
}

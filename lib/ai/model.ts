import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logAiCall } from "@/lib/ai/logAiCall";

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

export type FallbackLog = {
  supabase: SupabaseClient;
  task: string;
  input?: string;
};

/** Try each model in turn; the first that succeeds wins. Logs each attempt when `log` is set. */
export async function withFallback<T>(
  fn: (model: LanguageModel, modelId: string) => Promise<T>,
  log?: FallbackLog,
  skipModelId?: string,
): Promise<T> {
  const chain = getModelChain().filter((m) => m.modelId !== skipModelId);
  if (chain.length === 0) throw new Error("No AI provider configured");
  let last: unknown;
  for (const { model, modelId } of chain) {
    const started = Date.now();
    try {
      const result = await fn(model, modelId);
      if (log) {
        void logAiCall(log.supabase, {
          task: log.task,
          model: modelId,
          ok: true,
          durationMs: Date.now() - started,
          input: log.input,
        });
      }
      return result;
    } catch (e) {
      last = e;
      const message = e instanceof Error ? e.message : String(e);
      if (log) {
        void logAiCall(log.supabase, {
          task: log.task,
          model: modelId,
          ok: false,
          error: message,
          durationMs: Date.now() - started,
          input: log.input,
        });
      }
      console.warn(`model ${modelId} failed, trying next:`, message);
    }
  }
  throw last;
}

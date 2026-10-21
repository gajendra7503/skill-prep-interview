import Anthropic from "@anthropic-ai/sdk";
import { ApiError as GeminiApiError, FinishReason, GoogleGenAI, ThinkingLevel, type Content } from "@google/genai";

export type ProviderName = "anthropic" | "gemini";
export type TutorTurn = { role: "user" | "assistant"; content: string };

/** What a finished answer reports back for logging. */
export type TutorFinish = {
  status: "ok" | "refused" | "truncated";
  model: string;
  inputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  outputTokens: number;
};

/** One streaming answer from a provider: text chunks as they arrive, then a summary. */
export type ProviderStream = {
  chunks: AsyncIterable<string>;
  finish: () => Promise<TutorFinish>;
  abort: () => void;
};

export type TutorRequest = {
  instructions: string;
  /** The lesson text: stable per lesson, so providers can cache it. */
  lessonContext: string;
  messages: TutorTurn[];
};

/** A provider error worth showing the learner a specific message for. */
export type ProviderErrorKind = "rate_limited" | "auth" | "other";

export const DEFAULT_MODELS: Record<ProviderName, string> = {
  anthropic: "claude-opus-5-5",
  gemini: "gemini-3.6-flash",
};

/** Used when the main Gemini model is overloaded (503) or rate-limited (429) before any text is sent. */
export const GEMINI_FALLBACK_MODEL = "gemini-3.8-flash";

const isGeminiOverloaded = (error: unknown) =>
  error instanceof GeminiApiError && (error.status === 503 || error.status === 429);

// ── Anthropic (Claude) ─────────────────────────────────────────────────────────

function streamAnthropic(model: string, request: TutorRequest): ProviderStream {
  const client = new Anthropic();
  const stream = client.beta.messages.stream({
    model,
    max_tokens: 4096,
    // Tutoring chat doesn't need deep reasoning; low effort keeps answers quick and cheap.
    output_config: { effort: "low" },
    // If a safety classifier declines, retry on Anthropic's recommended fallback model instead of failing.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [
      { type: "text", text: request.instructions },
      { type: "text", text: request.lessonContext, cache_control: { type: "ephemeral" } },
    ],
    messages: request.messages,
  });

  async function* chunks() {
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield event.delta.text;
    }
  }

  return {
    chunks: chunks(),
    abort: () => stream.abort(),
    finish: async () => {
      const message = await stream.finalMessage();
      return {
        status: message.stop_reason === "refusal" ? "refused" : message.stop_reason === "max_tokens" ? "truncated" : "ok",
        model: message.model,
        inputTokens: message.usage.input_tokens,
        cacheReadTokens: message.usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: message.usage.cache_creation_input_tokens ?? 0,
        outputTokens: message.usage.output_tokens,
      };
    },
  };
}

// ── Google Gemini ──────────────────────────────────────────────────────────────

const GEMINI_BLOCKED = new Set<string>([
  FinishReason.SAFETY,
  FinishReason.RECITATION,
  FinishReason.BLOCKLIST,
  FinishReason.PROHIBITED_CONTENT,
  FinishReason.SPII,
]);

function streamGemini(model: string, request: TutorRequest, fallbackModel: string | null): ProviderStream {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const controller = new AbortController();
  const contents: Content[] = request.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  let finishReason: string | undefined;
  let blocked = false;
  let usage: { prompt: number; cached: number; output: number } = { prompt: 0, cached: 0, output: 0 };
  let servedModel = model;

  const open = (modelName: string) =>
    ai.models.generateContentStream({
      model: modelName,
      contents,
      config: {
        // Stable prefix (instructions + lesson) first, so Gemini's implicit caching can reuse it.
        systemInstruction: `${request.instructions}\n\n${request.lessonContext}`,
        maxOutputTokens: 4096,
        // Tutoring chat doesn't need deep reasoning; low thinking keeps answers quick and cheap.
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        abortSignal: controller.signal,
      },
    });

  async function* chunks() {
    let stream;
    try {
      stream = await open(model);
    } catch (error) {
      // Nothing has been sent to the learner yet, so switching models here is invisible to them.
      if (!fallbackModel || fallbackModel === model || !isGeminiOverloaded(error)) throw error;
      console.warn(`Gemini ${model} unavailable (${(error as GeminiApiError).status}); retrying on ${fallbackModel}`);
      servedModel = fallbackModel;
      stream = await open(fallbackModel);
    }
    for await (const chunk of stream) {
      if (chunk.promptFeedback?.blockReason) blocked = true;
      const candidate = chunk.candidates?.[0];
      if (candidate?.finishReason) finishReason = candidate.finishReason;
      if (chunk.modelVersion) servedModel = chunk.modelVersion;
      if (chunk.usageMetadata) {
        usage = {
          prompt: chunk.usageMetadata.promptTokenCount ?? 0,
          cached: chunk.usageMetadata.cachedContentTokenCount ?? 0,
          // Thinking tokens are billed as output.
          output: (chunk.usageMetadata.candidatesTokenCount ?? 0) + (chunk.usageMetadata.thoughtsTokenCount ?? 0),
        };
      }
      const text = chunk.text;
      if (text) yield text;
    }
  }

  return {
    chunks: chunks(),
    abort: () => controller.abort(),
    finish: async () => ({
      status: blocked || (finishReason && GEMINI_BLOCKED.has(finishReason)) ? "refused" : finishReason === FinishReason.MAX_TOKENS ? "truncated" : "ok",
      model: servedModel,
      // Gemini reports cached tokens as part of the prompt count; split them out to match the log columns.
      inputTokens: Math.max(0, usage.prompt - usage.cached),
      cacheReadTokens: usage.cached,
      cacheWriteTokens: 0,
      outputTokens: usage.output,
    }),
  };
}

// ── Dispatch ───────────────────────────────────────────────────────────────────

export function streamFromProvider(provider: ProviderName, model: string, request: TutorRequest): ProviderStream {
  return provider === "gemini" ? streamGemini(model, request, GEMINI_FALLBACK_MODEL) : streamAnthropic(model, request);
}

/** Classifies an SDK error so the learner sees a sensible message. */
export function classifyProviderError(error: unknown): ProviderErrorKind {
  if (error instanceof Anthropic.RateLimitError) return "rate_limited";
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) return "auth";
  if (error instanceof GeminiApiError) {
    // 429 = rate limited, 503 = model overloaded ("experiencing high demand").
    if (error.status === 429 || error.status === 503) return "rate_limited";
    if (error.status === 401 || error.status === 403) return "auth";
    // An invalid key comes back as 400 INVALID_ARGUMENT from the Gemini API.
    if (error.status === 400 && /api key/i.test(error.message)) return "auth";
  }
  return "other";
}

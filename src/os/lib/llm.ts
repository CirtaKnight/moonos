/**
 * Konshu's remote brain, provider-agnostic. Groq (free tier, OpenAI-compatible API) is the
 * default; Gemini still works when only a Gemini key is configured.
 *
 * Env: KONSHU_GROQ_API_KEY (+ optional KONSHU_GROQ_MODEL), or KONSHU_GEMINI_API_KEY
 * (+ optional KONSHU_GEMINI_MODEL). The KONSHU_ prefix is deliberate: some hosts inject
 * their own GEMINI_API_KEY / GROQ_API_KEY that only work through their paid gateways.
 */

export interface ChatTurn {
  role: "user" | "konshu";
  text: string;
}

export type ProviderName = "groq" | "gemini";

export interface Provider {
  name: ProviderName;
  label: string;
  key: string;
  /** Tried in order; the next one is used only if a model has been retired or renamed. */
  models: string[];
}

const GROQ_MODELS = ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "llama-3.1-8b-instant"];
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-flash-latest"];

const unique = (xs: (string | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x))];

export function pickProvider(env: Record<string, string | undefined>): Provider | null {
  if (env.KONSHU_GROQ_API_KEY) {
    return { name: "groq", label: "Groq", key: env.KONSHU_GROQ_API_KEY, models: unique([env.KONSHU_GROQ_MODEL, ...GROQ_MODELS]) };
  }
  if (env.KONSHU_GEMINI_API_KEY) {
    return { name: "gemini", label: "Gemini", key: env.KONSHU_GEMINI_API_KEY, models: unique([env.KONSHU_GEMINI_MODEL, ...GEMINI_MODELS]) };
  }
  return null;
}

const MAX_TOKENS = 400;
const TEMPERATURE = 0.4;

export function buildRequest(provider: Provider, model: string, system: string, history: ChatTurn[]): { url: string; init: RequestInit } {
  if (provider.name === "groq") {
    return {
      url: "https://api.groq.com/openai/v1/chat/completions",
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${provider.key}` },
        body: JSON.stringify({
          model,
          temperature: TEMPERATURE,
          max_tokens: MAX_TOKENS,
          messages: [
            { role: "system", content: system },
            ...history.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })),
          ],
        }),
      },
    };
  }
  return {
    url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": provider.key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: history.map((m) => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text }] })),
        generationConfig: { temperature: TEMPERATURE, maxOutputTokens: MAX_TOKENS },
      }),
    },
  };
}

/** Pull the answer text out of either provider's response. */
export function parseAnswer(provider: Provider, data: unknown): string {
  const d = data as {
    choices?: { message?: { content?: string } }[];
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  if (provider.name === "groq") return (d?.choices?.[0]?.message?.content ?? "").trim();
  return (d?.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
}

/** True when the failure is about the model itself (retired, renamed), so another model is worth a try. */
export function isModelError(status: number, body: string): boolean {
  if (status === 404) return true;
  return status === 400 && /model|decommission/i.test(body);
}

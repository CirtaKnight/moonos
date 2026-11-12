import { describe, expect, it } from "vitest";
import { buildRequest, isModelError, parseAnswer, pickProvider } from "./llm";

describe("pickProvider", () => {
  it("prefers Groq, falls back to Gemini, or nothing", () => {
    expect(pickProvider({ KONSHU_GROQ_API_KEY: "g", KONSHU_GEMINI_API_KEY: "x" })?.name).toBe("groq");
    expect(pickProvider({ KONSHU_GEMINI_API_KEY: "x" })?.name).toBe("gemini");
    expect(pickProvider({ GEMINI_API_KEY: "host-injected" })).toBeNull();
  });

  it("puts a configured model first without duplicates", () => {
    const p = pickProvider({ KONSHU_GROQ_API_KEY: "g", KONSHU_GROQ_MODEL: "llama-3.1-8b-instant" })!;
    expect(p.models[0]).toBe("llama-3.1-8b-instant");
    expect(new Set(p.models).size).toBe(p.models.length);
  });
});

describe("requests and answers", () => {
  const groq = pickProvider({ KONSHU_GROQ_API_KEY: "secret" })!;
  const gemini = pickProvider({ KONSHU_GEMINI_API_KEY: "secret" })!;
  const history = [
    { role: "user" as const, text: "hi" },
    { role: "konshu" as const, text: "hello" },
    { role: "user" as const, text: "projects?" },
  ];

  it("builds an OpenAI-style chat request for Groq", () => {
    const { url, init } = buildRequest(groq, "m", "SYSTEM", history);
    expect(url).toContain("api.groq.com");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer secret");
    const body = JSON.parse(init.body as string);
    expect(body.messages.map((m: { role: string }) => m.role)).toEqual(["system", "user", "assistant", "user"]);
  });

  it("builds a Gemini request with a system instruction", () => {
    const { url, init } = buildRequest(gemini, "gemini-2.5-flash", "SYSTEM", history);
    expect(url).toContain("gemini-2.5-flash:generateContent");
    const body = JSON.parse(init.body as string);
    expect(body.systemInstruction.parts[0].text).toBe("SYSTEM");
    expect(body.contents[1].role).toBe("model");
  });

  it("parses either provider's answer", () => {
    expect(parseAnswer(groq, { choices: [{ message: { content: " Hi there " } }] })).toBe("Hi there");
    expect(parseAnswer(gemini, { candidates: [{ content: { parts: [{ text: "A" }, { text: "B" }] } }] })).toBe("AB");
    expect(parseAnswer(groq, {})).toBe("");
  });

  it("recognises model errors worth retrying", () => {
    expect(isModelError(404, "")).toBe(true);
    expect(isModelError(400, '{"error":{"code":"model_decommissioned"}}')).toBe(true);
    expect(isModelError(401, "invalid api key")).toBe(false);
    expect(isModelError(429, "rate limit")).toBe(false);
  });
});

import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

export function getOpenAIApiKey() {
  return process.env.OPENAI_API_KEY?.trim() || "";
}

export function isOpenAIConfigured() {
  const key = getOpenAIApiKey();
  if (!key) return false;
  if (/\.\.\./.test(key)) return false;
  if (/your[_-]?/i.test(key)) return false;
  return key.startsWith("sk-");
}

export function getOpenAI() {
  if (!openaiClient) {
    const key = getOpenAIApiKey();
    if (!key || !isOpenAIConfigured()) {
      throw new Error("Missing OPENAI_API_KEY");
    }
    openaiClient = new OpenAI({ apiKey: key });
  }
  return openaiClient;
}

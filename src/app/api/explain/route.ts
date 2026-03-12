import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

const PROMPTS = {
  explain: (text: string) =>
    `You are a procurement and security analyst assistant. Explain the following text from a procurement ticket in clear, concise terms. Focus on what it means in a business/security context. Keep it to 2-3 sentences.\n\nText: "${text}"`,
  simplify: (text: string) =>
    `Rewrite the following text from a procurement ticket in plain English. Remove jargon, legal language, and complexity. Keep it short and direct.\n\nText: "${text}"`,
};

export async function POST(req: NextRequest) {
  const { text, mode } = await req.json() as { text: string; mode: "explain" | "simplify" };

  if (!text || typeof text !== "string") {
    return new Response(JSON.stringify({ error: "No text provided" }), { status: 400 });
  }

  const trimmed = text.trim().slice(0, 2000);
  const prompt = mode === "simplify" ? PROMPTS.simplify(trimmed) : PROMPTS.explain(trimmed);

  const stream = await client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

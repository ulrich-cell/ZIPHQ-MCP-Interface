import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";

const client = new Anthropic();

// In-memory rate limiter: max 10 requests per minute per session id
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(sessionId);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(sessionId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count += 1;
  return true;
}

const PROMPTS = {
  explain: (text: string) =>
    `You are a procurement and security analyst assistant. Explain the following text from a procurement ticket in clear, concise terms. Focus on what it means in a business/security context. Keep it to 2-3 sentences.\n\nText: "${text}"`,
  simplify: (text: string) =>
    `Rewrite the following text from a procurement ticket in plain English. Remove jargon, legal language, and complexity. Keep it short and direct.\n\nText: "${text}"`,
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  if (!checkRateLimit(session.id)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a minute." }), { status: 429 });
  }

  const { text, mode } = await req.json() as { text: string; mode: "explain" | "simplify" };

  if (!text || typeof text !== "string") {
    return new Response(JSON.stringify({ error: "No text provided" }), { status: 400 });
  }

  // Strip control characters (except common whitespace) and enforce length limit
  const sanitized = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, 2000);

  if (sanitized.length === 0) {
    return new Response(JSON.stringify({ error: "No valid text provided" }), { status: 400 });
  }

  const safeMode = mode === "simplify" ? "simplify" : "explain";
  const prompt = PROMPTS[safeMode](sanitized);

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

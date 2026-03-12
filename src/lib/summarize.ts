import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { ZipComment } from "./zip-api";

const client = new Anthropic();

export async function summarizeComments(comments: ZipComment[]): Promise<string | null> {
  if (comments.length === 0) return null;

  const commentText = comments
    .map((c) => {
      const name = c.commenter
        ? `${c.commenter.first_name} ${c.commenter.last_name}`
        : "Unknown";
      return `${name}: ${c.text || ""}`;
    })
    .join("\n\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Summarize the following procurement ticket comments in 2-3 plain sentences. Focus on key decisions, blockers, and outstanding actions. Do not use markdown, headings, or bullet points — just clean prose.\n\n${commentText}`,
      },
    ],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text : null;
}

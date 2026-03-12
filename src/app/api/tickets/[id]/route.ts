import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { getRequest, getVendor, searchComments } from "@/lib/zip-api";
import { summarizeComments } from "@/lib/summarize";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { id } = await params;

  const ticket = await getRequest(id).catch(() => null);
  if (!ticket) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const [vendor, comments] = await Promise.all([
    ticket.vendor?.id ? getVendor(ticket.vendor.id).catch(() => null) : Promise.resolve(null),
    searchComments(id).catch(() => []),
  ]);

  const summary = await summarizeComments(comments).catch(() => null);

  return new Response(JSON.stringify({ ticket, vendor, comments, summary }), {
    headers: { "Content-Type": "application/json" },
  });
}

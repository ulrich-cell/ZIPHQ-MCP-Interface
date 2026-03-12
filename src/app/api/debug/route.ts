import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.ZIP_BASE_URL || "https://api.ziphq.com";
  const apiKey = process.env.ZIP_API_KEY_PROD || process.env.ZIP_API_KEY || "";
  const keyPreview = apiKey ? `${apiKey.substring(0, 8)}...` : "MISSING";
  const headers = { "Zip-Api-Key": apiKey, Accept: "application/json" };

  try {
    // 1. Check what approvals come back (first page)
    const appRes = await fetch(`${baseUrl}/approvals?page_size=10`, { headers });
    const appData = await appRes.json();
    const sampleApprovals = (appData?.list ?? []).slice(0, 3).map((a: Record<string, unknown>) => ({
      id: a.id,
      status: a.status,
      assignee: a.assignee,
      request_id: (a.request as Record<string, unknown>)?.id,
    }));

    // 2. How many total approvals?
    const totalApprovals = appData?.total ?? 0;

    // 3. Check requests (first page)
    const reqRes = await fetch(`${baseUrl}/requests?page_size=10`, { headers });
    const reqData = await reqRes.json();
    const totalRequests = reqData?.total ?? 0;
    const sampleRequests = (reqData?.list ?? []).slice(0, 3).map((r: Record<string, unknown>) => ({
      id: r.id,
      request_number: r.request_number,
      status: r.status,
      requester: r.requester,
      creator: r.creator,
    }));

    // 4. Session info (no sensitive data)
    const sessionInfo = { id: session.id, email: session.email };

    return NextResponse.json({
      keyPreview,
      sessionInfo,
      approvals: { total: totalApprovals, sample: sampleApprovals },
      requests: { total: totalRequests, sample: sampleRequests },
    });
  } catch (error) {
    return NextResponse.json({
      keyPreview,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

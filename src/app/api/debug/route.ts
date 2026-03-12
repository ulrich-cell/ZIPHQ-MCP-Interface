import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.ZIP_BASE_URL || "https://api.ziphq.com";
  const apiKey = process.env.ZIP_API_KEY_PROD || process.env.ZIP_API_KEY || "";
  const keyPreview = apiKey ? `${apiKey.substring(0, 8)}...` : "MISSING";

  const headers = { "Zip-Api-Key": apiKey, Accept: "application/json" };

  try {
    // Find ticket with most comments
    const reqRes = await fetch(`${baseUrl}/requests?page_size=50`, { headers });
    const reqData = await reqRes.json();
    const requests: Array<{ id: string }> = reqData?.list ?? [];

    let best: { id: string; total: number; raw: unknown } | null = null;
    for (const req of requests) {
      const comRes = await fetch(`${baseUrl}/comments?request_guid=${req.id}&page_size=100`, { headers });
      const comData = await comRes.json();
      const total = comData?.total ?? 0;
      if (total > (best?.total ?? 0)) {
        best = { id: req.id, total, raw: comData };
      }
      if ((best?.total ?? 0) >= 4) break;
    }

    return NextResponse.json({ keyPreview, best });
  } catch (error) {
    return NextResponse.json({ keyPreview, error: error instanceof Error ? error.message : String(error) });
  }
}

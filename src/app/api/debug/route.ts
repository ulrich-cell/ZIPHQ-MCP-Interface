import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.ZIP_BASE_URL || "https://api.ziphq.com";
  const apiKey = process.env.ZIP_API_KEY_PROD || process.env.ZIP_API_KEY || "";
  const keyPreview = apiKey ? `${apiKey.substring(0, 8)}...` : "MISSING";

  const headers = { "Zip-Api-Key": apiKey, Accept: "application/json" };

  try {
    // Find a request with comments and check pagination
    const reqRes = await fetch(`${baseUrl}/requests?page_size=50`, { headers });
    const reqData = await reqRes.json();
    const requests: Array<{ id: string }> = reqData?.list ?? [];

    let commentDebug = null;
    for (const req of requests) {
      const comRes = await fetch(`${baseUrl}/comments?request_guid=${req.id}&page_size=100`, { headers });
      const comData = await comRes.json();
      if ((comData?.list?.length ?? 0) > 0) {
        commentDebug = {
          request_id: req.id,
          total: comData.total,
          size: comData.size,
          returned: comData.list?.length,
          next_page_token: comData.next_page_token ?? null,
        };
        break;
      }
    }

    return NextResponse.json({ keyPreview, commentDebug });
  } catch (error) {
    return NextResponse.json({ keyPreview, error: error instanceof Error ? error.message : String(error) });
  }
}

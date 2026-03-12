import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.ZIP_BASE_URL || "https://api.ziphq.com";
  const apiKey = process.env.ZIP_API_KEY_PROD || process.env.ZIP_API_KEY || "";
  const keyPreview = apiKey ? `${apiKey.substring(0, 8)}...` : "MISSING";

  const headers = { "Zip-Api-Key": apiKey, Accept: "application/json" };

  try {
    // Fetch a sample approval to inspect its shape
    const appRes = await fetch(`${baseUrl}/approvals?page_size=1&status=1`, { headers });
    const appData = await appRes.json();
    const sampleApproval = appData?.list?.[0] ?? null;

    return NextResponse.json({ keyPreview, sampleApproval });
  } catch (error) {
    return NextResponse.json({ keyPreview, error: error instanceof Error ? error.message : String(error) });
  }
}

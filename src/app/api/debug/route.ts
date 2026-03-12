import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.ZIP_BASE_URL || "https://api.ziphq.com";
  const apiKey = process.env.ZIP_API_KEY || "";

  const keyPreview = apiKey ? `${apiKey.substring(0, 8)}...` : "MISSING";

  try {
    const url = `${baseUrl}/requests?page_size=1`;
    const response = await fetch(url, {
      headers: {
        "Zip-Api-Key": apiKey,
        Accept: "application/json",
      },
    });

    const status = response.status;
    const contentType = response.headers.get("content-type") || "";
    const body = await response.text();
    const isJson = contentType.includes("json");

    return NextResponse.json({
      env: { baseUrl, keyPreview },
      request: { url },
      response: {
        status,
        contentType,
        isJson,
        body: isJson ? JSON.parse(body) : body.substring(0, 200),
      },
    });
  } catch (error) {
    return NextResponse.json({
      env: { baseUrl, keyPreview },
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

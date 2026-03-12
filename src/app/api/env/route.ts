import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json() as { env: "sandbox" | "prod" };
  const { env } = body;

  const response = NextResponse.json({ ok: true, env });
  response.cookies.set("zip_env", env, {
    httpOnly: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}

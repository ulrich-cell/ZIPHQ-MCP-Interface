import { NextRequest, NextResponse } from "next/server";

const VALID_ENVS = new Set(["sandbox", "prod"]);

export async function POST(request: NextRequest) {
  const body = await request.json() as { env: unknown };
  const { env } = body;

  if (typeof env !== "string" || !VALID_ENVS.has(env)) {
    return NextResponse.json({ error: "Invalid env value" }, { status: 400 });
  }

  const safeEnv = env as "sandbox" | "prod";
  const response = NextResponse.json({ ok: true, env: safeEnv });
  response.cookies.set("zip_env", safeEnv, {
    httpOnly: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

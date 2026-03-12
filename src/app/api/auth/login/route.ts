import { NextRequest, NextResponse } from "next/server";
import { searchUserByEmail } from "@/lib/zip-api";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email: string = body?.email ?? "";

  const user = await searchUserByEmail(email);

  if (!user) {
    return NextResponse.json(
      { error: "No Zip user found with that email" },
      { status: 404 }
    );
  }

  const { id, first_name, last_name } = user;
  const sessionValue = JSON.stringify({ id, email: user.email, first_name, last_name });

  const response = NextResponse.json(
    { ok: true, user: { id, email: user.email, first_name, last_name } },
    { status: 200 }
  );

  response.cookies.set("zip_session", sessionValue, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}

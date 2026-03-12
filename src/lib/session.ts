import "server-only";
import { cookies } from "next/headers";

export interface SessionUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get("zip_session")?.value;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionUser;
    if (!parsed?.id || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { EnvSwitcher } from "./env-switcher";

export async function Header() {
  const session = await getSession();
  const cookieStore = await cookies();
  const zipEnv = (cookieStore.get("zip_env")?.value ?? "prod") as "sandbox" | "prod";

  return (
    <header className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="font-semibold text-foreground">ZipHQ Dashboard</span>
        <EnvSwitcher currentEnv={zipEnv} />
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          Read Only
        </span>
      </div>

      {session && (
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {session.first_name} {session.last_name}
            </p>
            <p className="text-xs text-muted-foreground">{session.email}</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </header>
  );
}

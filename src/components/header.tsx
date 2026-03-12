import { getSession } from "@/lib/session";

export async function Header() {
  const session = await getSession();

  return (
    <header className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
      <span className="font-semibold text-foreground">ZipHQ Dashboard</span>

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

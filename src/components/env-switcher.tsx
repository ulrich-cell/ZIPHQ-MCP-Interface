"use client";

import { useRouter } from "next/navigation";

interface EnvSwitcherProps {
  currentEnv: "sandbox" | "prod";
}

export function EnvSwitcher({ currentEnv }: EnvSwitcherProps) {
  const router = useRouter();

  async function switchEnv(env: "sandbox" | "prod") {
    await fetch("/api/env", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ env }),
    });
    router.refresh();
  }

  return (
    <div className="flex items-center rounded-full border border-border bg-muted p-0.5 gap-0.5">
      <button
        onClick={() => switchEnv("sandbox")}
        className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${
          currentEnv === "sandbox"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Sandbox
      </button>
      <button
        onClick={() => switchEnv("prod")}
        className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${
          currentEnv === "prod"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Production
      </button>
    </div>
  );
}

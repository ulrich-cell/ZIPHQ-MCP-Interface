"use client";

import { useState, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  accent?: string;
  headerAccent?: string;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  accent,
  headerAccent,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-card shadow-sm ${accent ?? ""}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
        aria-expanded={open}
      >
        <div className={`flex items-center gap-2.5 text-sm font-medium ${headerAccent ?? "text-card-foreground"}`}>
          {icon && <span className="opacity-70">{icon}</span>}
          {title}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-border">
          {children}
        </div>
      )}
    </div>
  );
}

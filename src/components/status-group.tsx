"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ZipRequest } from "@/lib/zip-types";
import { TicketTable } from "./ticket-table";

interface StatusGroupProps {
  label: string;
  color: string;
  tickets: ZipRequest[];
  defaultOpen?: boolean;
}

export function StatusGroup({ label, color, tickets, defaultOpen = false }: StatusGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (tickets.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
            {label}
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-border">
          <TicketTable tickets={tickets} />
        </div>
      )}
    </div>
  );
}

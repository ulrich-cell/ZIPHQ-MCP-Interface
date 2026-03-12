import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ZipRequest } from "@/lib/zip-types";
import { formatEpoch, formatCurrency, requesterName } from "@/lib/zip-types";
import { StatusBadge } from "./status-badge";

interface TicketTableProps {
  tickets: ZipRequest[];
}

export function TicketTable({ tickets }: TicketTableProps) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">No tickets found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Request
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Status
            </th>
            <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
              Vendor
            </th>
            <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
              Requester
            </th>
            <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground sm:table-cell">
              Amount
            </th>
            <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
              Created
            </th>
            <th className="w-10 px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="group transition-colors hover:bg-muted/30"
            >
              <td className="px-4 py-3">
                <Link href={`/tickets/${ticket.id}`} target="_blank" rel="noopener noreferrer" className="block">
                  <span className="font-mono text-xs text-muted-foreground">
                    REQ-{ticket.request_number}
                  </span>
                  {ticket.name && (
                    <p className="mt-0.5 font-medium text-card-foreground line-clamp-1">
                      {ticket.name}
                    </p>
                  )}
                </Link>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={ticket.status} />
              </td>
              <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                {ticket.vendor?.name || "—"}
              </td>
              <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                {requesterName(ticket)}
              </td>
              <td className="hidden px-4 py-3 text-right font-mono text-muted-foreground sm:table-cell">
                {formatCurrency(
                  ticket.price_detail?.total,
                  ticket.price_detail?.currency
                )}
              </td>
              <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                {formatEpoch(ticket.created_at)}
              </td>
              <td className="px-4 py-3">
                <Link href={`/tickets/${ticket.id}`} target="_blank" rel="noopener noreferrer">
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

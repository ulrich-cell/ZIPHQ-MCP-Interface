"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  X,
  Hash,
  Calendar,
  User,
  DollarSign,
  Layers,
  ExternalLink,
  ArrowUpRight,
} from "lucide-react";
import type { ZipRequest, ZipVendor, ZipComment } from "@/lib/zip-types";
import {
  formatEpoch,
  formatEpochLong,
  formatCurrency,
  requesterName,
} from "@/lib/zip-types";
import { StatusBadge } from "./status-badge";
import { AttributePanel } from "./attribute-panel";
import { AttachmentsPanel } from "./attachments-panel";
import { VendorCard } from "./vendor-card";
import { CommentsTimeline } from "./comments-timeline";
import { AiExplainer } from "./ai-explainer";

interface TicketData {
  ticket: ZipRequest;
  vendor: ZipVendor | null;
  comments: ZipComment[];
  summary: string | null;
}

const TicketModalCtx = createContext<(id: string) => void>(() => {});

export function useOpenTicket() {
  return useContext(TicketModalCtx);
}

export function TicketModalProvider({ children }: { children: ReactNode }) {
  const [ticketId, setTicketId] = useState<string | null>(null);

  return (
    <TicketModalCtx.Provider value={setTicketId}>
      {children}
      {ticketId && (
        <ReadingModal ticketId={ticketId} onClose={() => setTicketId(null)} />
      )}
    </TicketModalCtx.Provider>
  );
}

function ReadingModal({
  ticketId,
  onClose,
}: {
  ticketId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);
    fetch(`/api/tickets/${ticketId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("Failed to load ticket"))
      .finally(() => setLoading(false));
  }, [ticketId]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [handleKeyDown]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Scroll container */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-start justify-center p-4 sm:p-8">
          {/* Panel */}
          <div
            className="relative w-full max-w-5xl rounded-2xl border border-border bg-background shadow-2xl my-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top bar */}
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-border bg-background/95 px-6 py-3 backdrop-blur-sm">
              <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                Reading View
              </span>
              <div className="flex items-center gap-2">
                {data?.ticket && (
                  <a
                    href={`/tickets/${ticketId}`}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    Full page
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Close reading view"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="space-y-4 p-8">
                <div className="h-8 w-2/3 animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-1/3 animate-pulse rounded-lg bg-muted" />
                <div className="mt-6 h-40 animate-pulse rounded-xl bg-muted" />
                <div className="h-40 animate-pulse rounded-xl bg-muted" />
                <div className="h-64 animate-pulse rounded-xl bg-muted" />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center justify-center p-24 text-muted-foreground">
                {error}
              </div>
            )}

            {/* Content */}
            {data && (
              <AiExplainer zClass="z-[70]">
                <ModalContent data={data} ticketId={ticketId} />
              </AiExplainer>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ModalContent({
  data,
  ticketId,
}: {
  data: TicketData;
  ticketId: string;
}) {
  const { ticket, vendor, comments, summary } = data;

  const amount = formatCurrency(
    ticket.price_detail?.total,
    ticket.price_detail?.currency
  );

  const safeRequestLink = (() => {
    if (!ticket.request_link) return null;
    try {
      const parsed = new URL(ticket.request_link);
      return parsed.protocol === "https:" ? ticket.request_link : null;
    } catch {
      return null;
    }
  })();

  const displayFields: Record<string, unknown> = {};
  if (ticket.description) displayFields["Description"] = ticket.description;
  if (ticket.request_type) displayFields["Request Type"] = ticket.request_type;
  if (ticket.payment_method)
    displayFields["Payment Method"] = ticket.payment_method;
  if (ticket.category?.name) displayFields["Category"] = ticket.category.name;
  if (ticket.subcategory?.name)
    displayFields["Subcategory"] = ticket.subcategory.name;
  if (ticket.subsidiary?.name)
    displayFields["Subsidiary"] = ticket.subsidiary.name;
  if (ticket.price_detail?.start_date)
    displayFields["Start Date"] = formatEpoch(ticket.price_detail.start_date);
  if (ticket.price_detail?.end_date)
    displayFields["End Date"] = formatEpoch(ticket.price_detail.end_date);

  return (
    <div className="p-6 sm:p-8">
      {/* Header card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-card-foreground">
                {ticket.name || `REQ-${ticket.request_number}`}
              </h2>
              <StatusBadge status={ticket.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" />
                REQ-{ticket.request_number}
              </span>
              {ticket.workflow?.name && (
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  {ticket.workflow.name}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {requesterName(ticket)}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatEpoch(ticket.created_at)}
              </span>
              {amount !== "—" && (
                <span className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  {amount}
                </span>
              )}
            </div>
          </div>
          {safeRequestLink && (
            <a
              href={safeRequestLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Open in Zip
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Department</p>
            <p className="text-sm font-medium text-card-foreground">
              {ticket.department?.name || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vendor</p>
            <p className="text-sm font-medium text-card-foreground">
              {ticket.vendor?.name || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Updated</p>
            <p className="text-sm font-medium text-card-foreground">
              {formatEpochLong(ticket.updated_at)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-sm font-medium text-card-foreground">
              {formatEpoch(ticket.completed_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {Object.keys(displayFields).length > 0 && (
            <AttributePanel attributes={displayFields} />
          )}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <AttachmentsPanel
              attachments={
                ticket.attachments as Array<{
                  id: string;
                  name: string;
                  url: string;
                  type?: string;
                }>
              }
            />
          )}
          <CommentsTimeline comments={comments} summary={summary} />
        </div>
        <div className="space-y-6">{vendor && <VendorCard vendor={vendor} />}</div>
      </div>

      {/* Bottom spacer */}
      <div className="h-8" />
    </div>
  );
}

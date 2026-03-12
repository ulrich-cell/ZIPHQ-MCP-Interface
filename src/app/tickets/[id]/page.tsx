import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Hash, Layers, User, DollarSign, ExternalLink, ShieldAlert, BarChart2, Info } from "lucide-react";
import {
  getRequest,
  getVendor,
  searchComments,
  formatEpoch,
  formatEpochLong,
  formatCurrency,
  requesterName,
} from "@/lib/zip-api";
import { summarizeComments } from "@/lib/summarize";
import { StatusBadge } from "@/components/status-badge";
import { CollapsibleSection } from "@/components/collapsible-section";
import { AttachmentsPanel } from "@/components/attachments-panel";
import { VendorCard } from "@/components/vendor-card";
import { CommentsTimeline } from "@/components/comments-timeline";
import { AiExplainer } from "@/components/ai-explainer";

// Known structured fields already shown in the header — exclude from sections
const HEADER_FIELDS = new Set([
  "id", "request_number", "name", "status", "priority", "vendor", "requester",
  "creator", "department", "subsidiary", "workflow", "category", "subcategory",
  "price_detail", "request_link", "created_at", "updated_at", "completed_at",
  "canceled_at", "initiated_at", "attachments", "amount_usd",
]);

// Keywords that indicate security / privacy / legal content
const SECURITY_KEYS = [
  "security", "privacy", "legal", "compliance", "risk", "gdpr", "pii",
  "data_protection", "data_access", "encryption", "hipaa", "sox", "pen_test",
  "vulnerability", "certification", "audit", "dpa", "nda", "contract",
  "third_party", "subprocessor", "breach", "incident",
];

// Keywords that indicate commercial / financial content
const COMMERCIAL_KEYS = [
  "payment", "billing", "invoice", "budget", "cost", "price", "fee",
  "subscription", "license", "renewal", "term", "contract_value", "spend",
  "discount", "currency", "po_", "purchase_order", "finance", "commercial",
];

function classifyField(key: string): "security" | "commercial" | "general" {
  const lower = key.toLowerCase();
  if (SECURITY_KEYS.some((k) => lower.includes(k))) return "security";
  if (COMMERCIAL_KEYS.some((k) => lower.includes(k))) return "commercial";
  return "general";
}

function formatKey(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function FieldGrid({ fields }: { fields: Record<string, unknown> }) {
  const entries = Object.entries(fields).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  );
  if (entries.length === 0) return null;
  return (
    <dl className="divide-y divide-border">
      {entries.map(([key, value]) => (
        <div key={key} className="flex gap-4 px-5 py-3">
          <dt className="w-1/3 shrink-0 text-sm font-medium text-muted-foreground">
            {formatKey(key)}
          </dt>
          <dd className="text-sm text-card-foreground break-words whitespace-pre-wrap">
            {formatValue(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

async function TicketContent({ id }: { id: string }) {
  const ticket = await getRequest(id);

  const [vendor, comments] = await Promise.all([
    ticket.vendor?.id
      ? getVendor(ticket.vendor.id).catch(() => null)
      : Promise.resolve(null),
    searchComments(id).catch(() => []),
  ]);

  const summary = await summarizeComments(comments).catch(() => null);

  const amount = formatCurrency(ticket.price_detail?.total, ticket.price_detail?.currency);

  const safeRequestLink = (() => {
    if (!ticket.request_link) return null;
    try {
      const parsed = new URL(ticket.request_link);
      return parsed.protocol === "https:" ? ticket.request_link : null;
    } catch {
      return null;
    }
  })();

  // Partition all ticket fields into sections
  const generalFields: Record<string, unknown> = {};
  const commercialFields: Record<string, unknown> = {};
  const securityFields: Record<string, unknown> = {};

  // Pre-populate known general fields
  if (ticket.description) generalFields["description"] = ticket.description;
  if (ticket.request_type) generalFields["request_type"] = ticket.request_type;
  if (ticket.category?.name) generalFields["category"] = ticket.category.name;
  if (ticket.subcategory?.name) generalFields["subcategory"] = ticket.subcategory.name;
  if (ticket.subsidiary?.name) generalFields["subsidiary"] = ticket.subsidiary.name;
  if (ticket.elapsed_time_total_days != null) generalFields["elapsed_days"] = ticket.elapsed_time_total_days;
  if (ticket.is_existing_vendor != null) generalFields["existing_vendor"] = ticket.is_existing_vendor ? "Yes" : "No";

  // Pre-populate known commercial fields
  if (ticket.payment_method) commercialFields["payment_method"] = ticket.payment_method;
  if (ticket.price_detail?.start_date) commercialFields["start_date"] = formatEpoch(ticket.price_detail.start_date);
  if (ticket.price_detail?.end_date) commercialFields["end_date"] = formatEpoch(ticket.price_detail.end_date);
  if (ticket.price_detail?.currency) commercialFields["currency"] = ticket.price_detail.currency;

  // Classify all remaining unknown fields
  for (const [key, value] of Object.entries(ticket)) {
    if (HEADER_FIELDS.has(key)) continue;
    if (key in generalFields || key in commercialFields || key in securityFields) continue;
    if (value === null || value === undefined || value === "") continue;

    const cls = classifyField(key);
    if (cls === "security") securityFields[key] = value;
    else if (cls === "commercial") commercialFields[key] = value;
    else generalFields[key] = value;
  }

  return (
    <div>
      {/* Header card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-card-foreground">
                {ticket.name || `REQ-${ticket.request_number}`}
              </h1>
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
        <div className="space-y-4 lg:col-span-2">

          {/* General Information */}
          {Object.keys(generalFields).length > 0 && (
            <CollapsibleSection
              title="General Information"
              icon={<Info className="h-4 w-4" />}
              defaultOpen
            >
              <FieldGrid fields={generalFields} />
            </CollapsibleSection>
          )}

          {/* Commercial Information */}
          {Object.keys(commercialFields).length > 0 && (
            <CollapsibleSection
              title="Commercial Information"
              icon={<BarChart2 className="h-4 w-4" />}
              defaultOpen={false}
            >
              <FieldGrid fields={commercialFields} />
            </CollapsibleSection>
          )}

          {/* Security, Privacy & Legal */}
          <CollapsibleSection
            title="Security, Privacy & Legal"
            icon={<ShieldAlert className="h-4 w-4" />}
            defaultOpen
            accent="border-amber-500/30 bg-amber-500/5"
            headerAccent="text-amber-400"
          >
            {Object.keys(securityFields).length > 0 ? (
              <FieldGrid fields={securityFields} />
            ) : (
              <p className="px-5 py-4 text-sm text-muted-foreground">
                No security or privacy fields detected on this ticket.
              </p>
            )}
          </CollapsibleSection>

          {/* Attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <AttachmentsPanel
              attachments={ticket.attachments as Array<{ id: string; name: string; url: string; type?: string }>}
            />
          )}

          {/* Comments */}
          <CommentsTimeline comments={comments} summary={summary} />
        </div>

        <div className="space-y-6">
          {vendor && <VendorCard vendor={vendor} />}
        </div>
      </div>
    </div>
  );
}

function TicketSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-48 animate-pulse rounded-xl border border-border bg-card" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-40 animate-pulse rounded-xl border border-border bg-card" />
          <div className="h-40 animate-pulse rounded-xl border border-border bg-card" />
          <div className="h-40 animate-pulse rounded-xl border border-border bg-card" />
        </div>
        <div className="h-40 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    </div>
  );
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AiExplainer>
      <div>
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
        <Suspense fallback={<TicketSkeleton />}>
          <TicketContent id={id} />
        </Suspense>
      </div>
    </AiExplainer>
  );
}

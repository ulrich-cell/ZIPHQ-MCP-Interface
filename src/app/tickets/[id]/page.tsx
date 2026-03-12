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

// Fields already shown in the header — skip in attribute sections
const HEADER_FIELDS = new Set([
  "id", "request_number", "name", "status", "priority", "vendor", "requester",
  "creator", "department", "subsidiary", "workflow", "category", "subcategory",
  "price_detail", "request_link", "created_at", "updated_at", "completed_at",
  "canceled_at", "initiated_at", "attachments", "amount_usd",
  // parsed separately
  "attributes", "elapsed_time_total_days", "is_existing_vendor",
  "description", "request_type", "payment_method",
]);

const SECURITY_KEYS = [
  "security", "privacy", "legal", "compliance", "risk", "gdpr", "pii",
  "data protection", "data access", "encryption", "hipaa", "sox",
  "vulnerability", "certification", "audit", "dpa", "nda", "contract",
  "third party", "subprocessor", "breach", "incident", "pen test",
  "questionnaire", "infosec", "cyber", "sensitive",
];

const COMMERCIAL_KEYS = [
  "payment", "billing", "invoice", "budget", "cost", "price", "fee",
  "subscription", "license", "renewal", "term", "spend", "discount",
  "currency", "purchase order", "finance", "commercial", "pricing",
  "net ", "po number",
];

function classifyByLabel(label: string): "security" | "commercial" | "general" {
  const lower = label.toLowerCase();
  if (SECURITY_KEYS.some((k) => lower.includes(k))) return "security";
  if (COMMERCIAL_KEYS.some((k) => lower.includes(k))) return "commercial";
  return "general";
}

// Smart value formatter — extracts .name/.display_name from objects,
// handles arrays of attributes, and avoids dumping raw JSON
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value || "—";
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    // Arrays of strings
    if (value.every((v) => typeof v === "string")) return value.join(", ");
    // Arrays of objects with name
    const names = value
      .map((v) => (typeof v === "object" && v !== null ? (v as Record<string, unknown>).display_name ?? (v as Record<string, unknown>).name : null))
      .filter(Boolean);
    if (names.length) return names.join(", ");
    return `${value.length} items`;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (obj.display_name) return String(obj.display_name);
    if (obj.name) return String(obj.name);
    if (obj.label) return String(obj.label);
    if (obj.value) return String(obj.value);
    // Last resort — only for simple flat objects
    const entries = Object.entries(obj).filter(([, v]) => typeof v !== "object" && v !== null);
    if (entries.length <= 3) return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
    return "(complex value)";
  }
  return String(value);
}

function formatKey(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface FieldEntry { label: string; value: string }

function FieldGrid({ fields }: { fields: FieldEntry[] }) {
  if (fields.length === 0) return null;
  return (
    <dl className="divide-y divide-border">
      {fields.map(({ label, value }) => (
        <div key={label} className="flex gap-4 px-5 py-3">
          <dt className="w-2/5 shrink-0 text-sm font-medium text-muted-foreground">{label}</dt>
          <dd className="text-sm text-card-foreground break-words whitespace-pre-wrap">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

async function TicketContent({ id }: { id: string }) {
  const ticket = await getRequest(id);

  const [vendor, comments] = await Promise.all([
    ticket.vendor?.id ? getVendor(ticket.vendor.id).catch(() => null) : Promise.resolve(null),
    searchComments(id).catch(() => []),
  ]);

  const summary = await summarizeComments(comments).catch(() => null);
  const amount = formatCurrency(ticket.price_detail?.total, ticket.price_detail?.currency);

  const safeRequestLink = (() => {
    if (!ticket.request_link) return null;
    try {
      const parsed = new URL(ticket.request_link);
      return parsed.protocol === "https:" ? ticket.request_link : null;
    } catch { return null; }
  })();

  // --- Build sections ---
  const generalFields: FieldEntry[] = [];
  const commercialFields: FieldEntry[] = [];
  const securityFields: FieldEntry[] = [];

  // Track seen labels (normalised) to prevent duplicates
  const seen = new Set<string>();
  const push = (target: FieldEntry[], label: string, value: string) => {
    const key = label.toLowerCase().trim();
    if (seen.has(key) || !value || value === "—") return;
    seen.add(key);
    target.push({ label, value });
  };

  // Description always first in General
  if (ticket.description) push(generalFields, "Description", ticket.description);

  // Other known general fields
  if (ticket.request_type) push(generalFields, "Request Type", ticket.request_type);
  if (ticket.category?.name) push(generalFields, "Category", ticket.category.name);
  if (ticket.subcategory?.name) push(generalFields, "Subcategory", ticket.subcategory.name);
  if (ticket.subsidiary?.name) push(generalFields, "Subsidiary", ticket.subsidiary.name);
  if (ticket.elapsed_time_total_days != null) push(generalFields, "Elapsed Days", String(ticket.elapsed_time_total_days));
  if (ticket.is_existing_vendor != null) push(generalFields, "Existing Vendor", ticket.is_existing_vendor ? "Yes" : "No");

  // Known commercial fields
  if (ticket.payment_method) push(commercialFields, "Payment Method", ticket.payment_method);
  if (ticket.price_detail?.start_date) push(commercialFields, "Start Date", formatEpoch(ticket.price_detail.start_date));
  if (ticket.price_detail?.end_date) push(commercialFields, "End Date", formatEpoch(ticket.price_detail.end_date));
  if (ticket.price_detail?.currency) push(commercialFields, "Currency", ticket.price_detail.currency);

  // Parse the `attributes` array — Zip stores all custom form answers here
  const attrs = ticket.attributes as Array<{ name?: string; data?: unknown }> | undefined;
  if (Array.isArray(attrs)) {
    for (const attr of attrs) {
      const label = attr.name?.trim();
      if (!label) continue;
      const value = formatValue(attr.data);
      const cls = classifyByLabel(label);
      if (cls === "security") push(securityFields, label, value);
      else if (cls === "commercial") push(commercialFields, label, value);
      else push(generalFields, label, value);
    }
  }

  // Remaining unknown top-level fields not already shown
  for (const [key, raw] of Object.entries(ticket)) {
    if (HEADER_FIELDS.has(key)) continue;
    if (raw === null || raw === undefined || raw === "") continue;
    // Skip arrays/objects we can't usefully display (already handled above)
    if (Array.isArray(raw)) continue;
    const label = formatKey(key);
    const value = formatValue(raw);
    if (!value || value === "—" || value === "(complex value)") continue;
    const cls = classifyByLabel(label);
    const entry = { label, value };
    if (cls === "security") securityFields.push(entry);
    else if (cls === "commercial") commercialFields.push(entry);
    else generalFields.push(entry);
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
              <span className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" />REQ-{ticket.request_number}</span>
              {ticket.workflow?.name && (
                <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" />{ticket.workflow.name}</span>
              )}
              <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{requesterName(ticket)}</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{formatEpoch(ticket.created_at)}</span>
              {amount !== "—" && (
                <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />{amount}</span>
              )}
            </div>
          </div>
          {safeRequestLink && (
            <a href={safeRequestLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              Open in Zip <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
          <div><p className="text-xs text-muted-foreground">Department</p><p className="text-sm font-medium text-card-foreground">{ticket.department?.name || "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Vendor</p><p className="text-sm font-medium text-card-foreground">{ticket.vendor?.name || "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Updated</p><p className="text-sm font-medium text-card-foreground">{formatEpochLong(ticket.updated_at)}</p></div>
          <div><p className="text-xs text-muted-foreground">Completed</p><p className="text-sm font-medium text-card-foreground">{formatEpoch(ticket.completed_at)}</p></div>
        </div>
      </div>

      {/* Body */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">

          {generalFields.length > 0 && (
            <CollapsibleSection title="General Information" icon={<Info className="h-4 w-4" />} defaultOpen>
              <FieldGrid fields={generalFields} />
            </CollapsibleSection>
          )}

          {commercialFields.length > 0 && (
            <CollapsibleSection title="Commercial Information" icon={<BarChart2 className="h-4 w-4" />} defaultOpen={false}>
              <FieldGrid fields={commercialFields} />
            </CollapsibleSection>
          )}

          <CollapsibleSection
            title="Security, Privacy & Legal"
            icon={<ShieldAlert className="h-4 w-4" />}
            defaultOpen
            accent="border-amber-500/30 bg-amber-500/5"
            headerAccent="text-amber-400"
          >
            {securityFields.length > 0 ? (
              <FieldGrid fields={securityFields} />
            ) : (
              <p className="px-5 py-4 text-sm text-muted-foreground">
                No security or privacy fields found on this ticket.
              </p>
            )}
          </CollapsibleSection>

          {ticket.attachments && ticket.attachments.length > 0 && (
            <AttachmentsPanel attachments={ticket.attachments as Array<{ id: string; name: string; url: string; type?: string }>} />
          )}

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
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-card" />)}
        </div>
        <div className="h-40 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    </div>
  );
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AiExplainer>
      <div>
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
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

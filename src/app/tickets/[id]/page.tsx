import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Hash, Layers, User, DollarSign, ExternalLink } from "lucide-react";
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
import { AttributePanel } from "@/components/attribute-panel";
import { VendorCard } from "@/components/vendor-card";
import { CommentsTimeline } from "@/components/comments-timeline";

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

  const displayFields: Record<string, unknown> = {};
  if (ticket.description) displayFields["Description"] = ticket.description;
  if (ticket.request_type) displayFields["Request Type"] = ticket.request_type;
  if (ticket.payment_method) displayFields["Payment Method"] = ticket.payment_method;
  if (ticket.category?.name) displayFields["Category"] = ticket.category.name;
  if (ticket.subcategory?.name) displayFields["Subcategory"] = ticket.subcategory.name;
  if (ticket.subsidiary?.name) displayFields["Subsidiary"] = ticket.subsidiary.name;
  if (ticket.price_detail?.start_date) displayFields["Start Date"] = formatEpoch(ticket.price_detail.start_date);
  if (ticket.price_detail?.end_date) displayFields["End Date"] = formatEpoch(ticket.price_detail.end_date);
  if (ticket.elapsed_time_total_days) displayFields["Elapsed Days"] = ticket.elapsed_time_total_days;
  if (ticket.is_existing_vendor !== null && ticket.is_existing_vendor !== undefined) {
    displayFields["Existing Vendor"] = ticket.is_existing_vendor ? "Yes" : "No";
  }

  if (ticket.attachments && ticket.attachments.length > 0) {
    displayFields["Attachments"] = ticket.attachments.map((a) => a.name).join(", ");
  }

  return (
    <div>
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
          {ticket.request_link && (
            <a
              href={ticket.request_link}
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

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {Object.keys(displayFields).length > 0 && (
            <AttributePanel attributes={displayFields} />
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
        <div className="space-y-6 lg:col-span-2">
          <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
          <div className="h-48 animate-pulse rounded-xl border border-border bg-card" />
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
  );
}

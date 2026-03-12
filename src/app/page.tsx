import { Suspense } from "react";
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { searchRequests, searchApprovals, getStatusInfo } from "@/lib/zip-api";
import { getSession } from "@/lib/session";
import { SummaryCard } from "@/components/summary-card";
import { TicketTable } from "@/components/ticket-table";

async function DashboardContent() {
  const session = await getSession();

  const [requestsResult, approvalsResult] = await Promise.all([
    searchRequests({ page_size: 100 }).catch(() => ({ data: [], total_count: 0 })),
    searchApprovals({ status: 1 }).catch(() => ({ data: [], total_count: 0 })),
  ]);

  // Filter approvals assigned to current user, then match to requests
  const myApprovals = session?.id
    ? approvalsResult.data.filter((a) => a.assignee?.id === session.id)
    : approvalsResult.data;

  const myRequestIds = new Set(myApprovals.map((a) => a.request?.id).filter(Boolean));

  const tickets = session?.id
    ? requestsResult.data.filter((t) => myRequestIds.has(t.id))
    : requestsResult.data;

  const totalCount = tickets.length;
  const pendingApprovals = myApprovals.length;

  const openTickets = tickets.filter((t) => t.status === 1);
  const inReviewTickets = tickets.filter((t) => t.status === 2);

  const statusCounts: Record<string, number> = {};
  for (const ticket of tickets) {
    const info = getStatusInfo(ticket.status);
    statusCounts[info.label] = (statusCounts[info.label] || 0) + 1;
  }

  const workflowCounts: Record<string, number> = {};
  for (const ticket of tickets) {
    const wf = ticket.workflow?.name || ticket.request_type || "Unknown";
    workflowCounts[wf] = (workflowCounts[wf] || 0) + 1;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Tickets"
          value={totalCount}
          subtitle={`${tickets.length} loaded`}
          icon={Inbox}
        />
        <SummaryCard
          title="Open"
          value={openTickets.length}
          subtitle="Active requests"
          icon={Clock}
          accent="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
        />
        <SummaryCard
          title="In Review"
          value={inReviewTickets.length}
          subtitle="Awaiting decision"
          icon={AlertTriangle}
          accent="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400"
        />
        <SummaryCard
          title="Pending Approvals"
          value={pendingApprovals}
          subtitle="Ready for action"
          icon={CheckCircle2}
          accent="bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">
            By Status
          </h3>
          <div className="space-y-3">
            {Object.entries(statusCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([label, count]) => {
                const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
                return (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-card-foreground">{label}</span>
                      <span className="font-mono text-muted-foreground">
                        {count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">
            By Workflow
          </h3>
          <div className="space-y-3">
            {Object.entries(workflowCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([label, count]) => {
                const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
                return (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-card-foreground line-clamp-1">
                        {label}
                      </span>
                      <span className="ml-2 shrink-0 font-mono text-muted-foreground">
                        {count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-accent/70 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          Recent Tickets
        </h2>
        <TicketTable tickets={tickets} />
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-border bg-card"
          />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-xl border border-border bg-card"
          />
        ))}
      </div>
      <div className="mt-6 h-96 animate-pulse rounded-xl border border-border bg-card" />
    </>
  );
}

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ZipHQ ticket overview and security review status
        </p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

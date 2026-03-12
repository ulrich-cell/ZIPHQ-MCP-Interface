import { Suspense } from "react";
import { Inbox, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { searchRequests, searchApprovals, REQUEST_STATUSES } from "@/lib/zip-api";
import type { ZipRequest } from "@/lib/zip-api";
import { getSession } from "@/lib/session";
import { SummaryCard } from "@/components/summary-card";
import { StatusGroup } from "@/components/status-group";

// Statuses that are actionable — expanded by default
const DEFAULT_OPEN = new Set([1, 2]);

// Display order
const STATUS_ORDER = [2, 1, 0, 3, 4, 5, 6];

async function DashboardContent() {
  const session = await getSession();

  // Fetch all statuses in parallel — the API defaults to active only,
  // so we explicitly request each terminal status too
  const [
    activeResult,
    approvedResult,
    rejectedResult,
    completedResult,
    canceledResult,
    draftResult,
    approvalsResult,
  ] = await Promise.all([
    searchRequests({ page_size: 200 }).catch(() => ({ data: [], total_count: 0 })),
    searchRequests({ page_size: 100, status: 3 }).catch(() => ({ data: [], total_count: 0 })),
    searchRequests({ page_size: 100, status: 4 }).catch(() => ({ data: [], total_count: 0 })),
    searchRequests({ page_size: 100, status: 5 }).catch(() => ({ data: [], total_count: 0 })),
    searchRequests({ page_size: 100, status: 6 }).catch(() => ({ data: [], total_count: 0 })),
    searchRequests({ page_size: 50, status: 0 }).catch(() => ({ data: [], total_count: 0 })),
    searchApprovals({ page_size: 500 }).catch(() => ({ data: [], total_count: 0 })),
  ]);

  // Merge all results, deduplicated by id
  const allRequestsMap = new Map<string, ZipRequest>();
  for (const r of [
    ...activeResult.data,
    ...approvedResult.data,
    ...rejectedResult.data,
    ...completedResult.data,
    ...canceledResult.data,
    ...draftResult.data,
  ]) {
    allRequestsMap.set(r.id, r);
  }

  // Filter approvals assigned to current user (client-side)
  const myApprovals = session?.id
    ? approvalsResult.data.filter((a) => a.assignee?.id === session.id)
    : approvalsResult.data;

  const myApprovalRequestIds = new Set(myApprovals.map((a) => a.request?.id).filter(Boolean));

  const tickets: ZipRequest[] = session?.id
    ? [...allRequestsMap.values()].filter(
        (t) =>
          myApprovalRequestIds.has(t.id) ||
          t.requester?.id === session.id ||
          t.creator?.id === session.id
      )
    : [...allRequestsMap.values()];

  // Group by request status
  const grouped: Record<number, ZipRequest[]> = {};
  for (const ticket of tickets) {
    const s = ticket.status ?? -1;
    if (!grouped[s]) grouped[s] = [];
    grouped[s].push(ticket);
  }

  const totalCount = tickets.length;
  const pendingApprovals = myApprovals.filter((a) => a.status === 1).length;
  const openTickets = grouped[1]?.length ?? 0;
  const inReviewTickets = grouped[2]?.length ?? 0;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Total Tickets" value={totalCount} subtitle="Assigned to me" icon={Inbox} />
        <SummaryCard title="Open" value={openTickets} subtitle="Active requests" icon={Clock}
          accent="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400" />
        <SummaryCard title="In Review" value={inReviewTickets} subtitle="Awaiting decision" icon={AlertTriangle}
          accent="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400" />
        <SummaryCard title="Pending Approvals" value={pendingApprovals} subtitle="Ready for action" icon={CheckCircle2}
          accent="bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400" />
      </div>

      <div className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">My Tickets</h2>
        {tickets.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">No tickets assigned to you.</p>
          </div>
        ) : (
          STATUS_ORDER.filter((s) => grouped[s]?.length > 0).map((statusCode) => {
            const info = REQUEST_STATUSES[statusCode] ?? { label: `Status ${statusCode}`, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" };
            return (
              <StatusGroup
                key={statusCode}
                label={info.label}
                color={info.color}
                tickets={grouped[statusCode]}
                defaultOpen={DEFAULT_OPEN.has(statusCode)}
              />
            );
          })
        )}
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-card" />
        ))}
      </div>
      <div className="mt-8 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-card" />
        ))}
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">ZipHQ ticket overview and security review status</p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

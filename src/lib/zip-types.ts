// Pure types and formatting utilities — no server-only imports.
// Safe to import from both server and client components.

export interface ZipRequest {
  id: string;
  request_number: number;
  name?: string;
  description?: string;
  status: number;
  priority?: number;
  request_type?: string;
  payment_method?: string;
  amount_usd?: string;
  vendor?: { id: string; name: string; type?: string } | null;
  requester?: { id: string; email: string; first_name: string; last_name: string } | null;
  creator?: { id: string; email: string; first_name: string; last_name: string } | null;
  department?: { id: string; name: string } | null;
  subsidiary?: { id: string; name: string } | null;
  workflow?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
  subcategory?: { id: string; name: string } | null;
  price_detail?: {
    total: string;
    currency: string;
    start_date?: number | null;
    end_date?: number | null;
  } | null;
  request_link?: string;
  created_at?: number;
  updated_at?: number;
  completed_at?: number | null;
  canceled_at?: number | null;
  initiated_at?: number | null;
  attachments?: Array<{ id: string; name: string; url: string; type?: string }>;
  [key: string]: unknown;
}

export interface ZipVendor {
  id: string;
  name: string;
  domain?: string;
  status?: string;
  category?: string;
  created_at?: number;
  [key: string]: unknown;
}

export interface ZipComment {
  id: string;
  text?: string;
  text_html?: string;
  commenter?: { id: string; first_name: string; last_name: string; email: string };
  created_at?: number;
  updated_at?: number;
  comment_responses?: ZipComment[];
  [key: string]: unknown;
}

export interface ZipWorkflow {
  id: string;
  name: string;
  status?: string;
  [key: string]: unknown;
}

export interface ZipApproval {
  id: string;
  status: number;
  node_type?: string;
  assignee?: { id: string; email: string; first_name: string; last_name: string };
  request?: { id: string; request_number: number; name?: string; request_type?: string };
  [key: string]: unknown;
}

export interface ZipUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active?: boolean;
}

export interface RequestFilters {
  status?: number;
  request_type?: string;
  vendor_name?: string;
  department_name?: string;
  created_after?: number;
  created_before?: number;
  include_attributes?: boolean;
  page_size?: number;
  page_token?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  requester_id?: string;
}

// --- Display helpers ---

export function formatEpoch(epoch?: number | null): string {
  if (!epoch) return "—";
  return new Date(epoch * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatEpochLong(epoch?: number | null): string {
  if (!epoch) return "—";
  return new Date(epoch * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function requesterName(req: ZipRequest): string {
  if (req.requester) return `${req.requester.first_name} ${req.requester.last_name}`;
  return "—";
}

export function formatCurrency(amount?: string | null, currency?: string): string {
  if (!amount) return "—";
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export const REQUEST_STATUSES: Record<number, { label: string; color: string }> = {
  0: { label: "Draft", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  1: { label: "Open", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  2: { label: "In Review", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  3: { label: "Approved", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  4: { label: "Rejected", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  5: { label: "Completed", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  6: { label: "Canceled", color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
};

export function getStatusInfo(status: number) {
  return REQUEST_STATUSES[status] ?? {
    label: `Status ${status}`,
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };
}

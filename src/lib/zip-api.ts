import "server-only";
import { cookies } from "next/headers";

const BASE_URL = process.env.ZIP_BASE_URL || "https://api.ziphq.com";

async function getApiKey(): Promise<string> {
  const cookieStore = await cookies();
  const zipEnv = cookieStore.get("zip_env")?.value;
  if (zipEnv === "sandbox") {
    return process.env.ZIP_API_KEY_SANDBOX || process.env.ZIP_API_KEY || "";
  }
  return process.env.ZIP_API_KEY_PROD || process.env.ZIP_API_KEY || "";
}

interface ZipListResponse<T> {
  list: T[];
  size: number;
  total: number;
  next_page_token?: string;
}

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

class ZipApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public responseBody?: string
  ) {
    super(message);
    this.name = "ZipApiError";
  }
}

async function zipFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const API_KEY = await getApiKey();
  if (!API_KEY) {
    throw new ZipApiError(401, "ZIP_API_KEY is not configured");
  }

  const url = new URL(`${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      "Zip-Api-Key": API_KEY,
      Accept: "application/json",
    },
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new ZipApiError(response.status, `ZipHQ API error (${response.status})`, body);
  }

  return response.json() as Promise<T>;
}

function toParams(
  obj: Record<string, unknown>
): Record<string, string | number | boolean | undefined> {
  const result: Record<string, string | number | boolean | undefined> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) result[k] = v as string | number | boolean;
  }
  return result;
}

// --- Requests ---

export async function searchRequests(
  filters: RequestFilters = {}
): Promise<{ data: ZipRequest[]; total_count: number; next_page_token?: string }> {
  const resp = await zipFetch<ZipListResponse<ZipRequest>>(
    "/requests",
    toParams({ page_size: 50, ...filters })
  );
  return { data: resp.list, total_count: resp.total, next_page_token: resp.next_page_token };
}

export async function getRequest(id: string): Promise<ZipRequest> {
  return zipFetch<ZipRequest>(`/requests/${id}`);
}

// --- Vendors ---

export async function getVendor(id: string): Promise<ZipVendor> {
  return zipFetch<ZipVendor>(`/vendors/${id}`);
}

// --- Comments ---

export async function searchComments(
  requestGuid: string
): Promise<ZipComment[]> {
  const resp = await zipFetch<ZipListResponse<ZipComment>>("/comments", {
    request_guid: requestGuid,
  });
  return resp.list ?? [];
}

// --- Workflows ---

export async function listWorkflows(): Promise<ZipWorkflow[]> {
  const resp = await zipFetch<ZipListResponse<ZipWorkflow>>("/workflows");
  return resp.list ?? [];
}

// --- Approvals ---

export async function searchApprovals(filters: {
  status?: number;
  request_number?: string;
  page_size?: number;
}): Promise<{ data: ZipApproval[]; total_count: number }> {
  const resp = await zipFetch<ZipListResponse<ZipApproval>>(
    "/approvals",
    toParams({ page_size: 100, ...filters })
  );
  return { data: resp.list, total_count: resp.total };
}

// --- Users ---

export async function searchUserByEmail(email: string): Promise<ZipUser | null> {
  const resp = await zipFetch<ZipListResponse<ZipUser>>("/users", { email });
  return resp.list?.[0] ?? null;
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

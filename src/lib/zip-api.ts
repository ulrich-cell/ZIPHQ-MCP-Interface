import "server-only";
import { cookies } from "next/headers";

// Re-export everything from zip-types so server components can use a single import
export type {
  ZipRequest,
  ZipVendor,
  ZipComment,
  ZipWorkflow,
  ZipApproval,
  ZipUser,
  RequestFilters,
} from "./zip-types";
export {
  formatEpoch,
  formatEpochLong,
  requesterName,
  formatCurrency,
  REQUEST_STATUSES,
  getStatusInfo,
} from "./zip-types";

import type {
  ZipRequest,
  ZipVendor,
  ZipComment,
  ZipWorkflow,
  ZipApproval,
  ZipUser,
  RequestFilters,
} from "./zip-types";

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
    cache: "no-store",
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

function flattenComments(comments: ZipComment[]): ZipComment[] {
  const result: ZipComment[] = [];
  for (const c of comments) {
    result.push(c);
    if (c.comment_responses?.length) {
      result.push(...flattenComments(c.comment_responses));
    }
  }
  return result;
}

export async function searchComments(
  requestGuid: string
): Promise<ZipComment[]> {
  const resp = await zipFetch<ZipListResponse<ZipComment>>("/comments", {
    request_guid: requestGuid,
    page_size: 100,
  });
  return flattenComments(resp.list ?? []);
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
} = {}): Promise<{ data: ZipApproval[]; total_count: number }> {
  const resp = await zipFetch<ZipListResponse<ZipApproval>>(
    "/approvals",
    toParams({ page_size: 500, ...filters })
  );
  return { data: resp.list, total_count: resp.total };
}

// --- Users ---

export async function searchUserByEmail(email: string): Promise<ZipUser | null> {
  const resp = await zipFetch<ZipListResponse<ZipUser>>("/users", { email });
  return resp.list?.[0] ?? null;
}
